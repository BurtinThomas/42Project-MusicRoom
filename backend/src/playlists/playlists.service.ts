import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EditLicense,
  Playlist,
  SubscriptionPlan,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddPlaylistTrackDto } from './dto/add-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { MovePlaylistTrackDto } from './dto/move-track.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async create(ownerId: string, dto: CreatePlaylistDto): Promise<Playlist> {
    const visibility = dto.visibility ?? Visibility.PUBLIC;
    const editLicense = dto.editLicense ?? EditLicense.OPEN;

    const isCollaborative =
      visibility === Visibility.PUBLIC || editLicense === EditLicense.OPEN;
    if (isCollaborative) {
      const owner = await this.prisma.user.findUniqueOrThrow({
        where: { id: ownerId },
      });
      if (owner.subscriptionPlan !== SubscriptionPlan.PAID) {
        throw new ForbiddenException(
          'Collaborative playlists (public or open-edit) require a paid subscription. ' +
            'Free accounts can create private, owner-only playlists.',
        );
      }
    }

    return this.prisma.playlist.create({
      data: {
        ownerId,
        name: dto.name,
        visibility,
        editLicense,
        requiresPaidPlan: isCollaborative,
      },
    });
  }

  listVisible(userId: string) {
    return this.prisma.playlist.findMany({
      where: {
        OR: [
          { visibility: Visibility.PUBLIC },
          { ownerId: userId },
          { invites: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrThrow(playlistId: string): Promise<Playlist> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    return playlist;
  }

  private async canView(playlist: Playlist, userId: string): Promise<boolean> {
    if (playlist.visibility === Visibility.PUBLIC) return true;
    if (playlist.ownerId === userId) return true;
    const invite = await this.prisma.playlistInvite.findUnique({
      where: { playlistId_userId: { playlistId: playlist.id, userId } },
    });
    return !!invite;
  }

  private async assertCanEdit(
    playlist: Playlist,
    userId: string,
  ): Promise<void> {
    const visible = await this.canView(playlist, userId);
    if (!visible) throw new ForbiddenException('This playlist is private');
    if (playlist.ownerId === userId) return;
    if (playlist.editLicense === EditLicense.OPEN) return;

    const invite = await this.prisma.playlistInvite.findUnique({
      where: { playlistId_userId: { playlistId: playlist.id, userId } },
    });
    if (!invite)
      throw new ForbiddenException('Only invited users can edit this playlist');
  }

  async invite(ownerId: string, playlistId: string, userId: string) {
    const playlist = await this.getOrThrow(playlistId);
    if (playlist.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can invite users');
    }
    return this.prisma.playlistInvite.upsert({
      where: { playlistId_userId: { playlistId, userId } },
      create: { playlistId, userId },
      update: {},
    });
  }

  async getDetail(userId: string, playlistId: string) {
    const playlist = await this.getOrThrow(playlistId);
    const visible = await this.canView(playlist, userId);
    if (!visible) throw new ForbiddenException('This playlist is private');

    const tracks = await this.prisma.playlistTrack.findMany({
      where: { playlistId },
      include: { track: true },
      orderBy: { position: 'asc' },
    });
    return { playlist, tracks };
  }

  async addTrack(userId: string, playlistId: string, dto: AddPlaylistTrackDto) {
    const playlist = await this.getOrThrow(playlistId);
    await this.assertCanEdit(playlist, userId);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.playlistTrack.count({ where: { playlistId } });
      const insertAt =
        dto.position != null
          ? Math.max(0, Math.min(dto.position, count))
          : count;

      if (insertAt < count) {
        await tx.playlistTrack.updateMany({
          where: { playlistId, position: { gte: insertAt } },
          data: { position: { increment: 1 } },
        });
      }

      const track = await tx.track.create({
        data: {
          title: dto.title,
          artist: dto.artist,
          durationMs: dto.durationMs,
          externalRef: dto.externalRef,
        },
      });

      const playlistTrack = await tx.playlistTrack.create({
        data: {
          playlistId,
          trackId: track.id,
          addedById: userId,
          position: insertAt,
        },
        include: { track: true },
      });

      this.events.emit('playlist.track.added', { playlistId, playlistTrack });
      return playlistTrack;
    });
  }

  async removeTrack(
    userId: string,
    playlistId: string,
    playlistTrackId: string,
  ) {
    const playlist = await this.getOrThrow(playlistId);
    await this.assertCanEdit(playlist, userId);

    await this.prisma.$transaction(async (tx) => {
      const track = await tx.playlistTrack.findFirst({
        where: { id: playlistTrackId, playlistId },
      });
      if (!track)
        throw new NotFoundException('Track not found in this playlist');

      await tx.playlistTrack.delete({ where: { id: playlistTrackId } });
      await tx.playlistTrack.updateMany({
        where: { playlistId, position: { gt: track.position } },
        data: { position: { decrement: 1 } },
      });
    });

    this.events.emit('playlist.track.removed', { playlistId, playlistTrackId });
    return { message: 'Track removed' };
  }

  async moveTrack(
    userId: string,
    playlistId: string,
    playlistTrackId: string,
    dto: MovePlaylistTrackDto,
  ) {
    const playlist = await this.getOrThrow(playlistId);
    await this.assertCanEdit(playlist, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const moved = await tx.playlistTrack.findFirst({
        where: { id: playlistTrackId, playlistId },
      });
      if (!moved)
        throw new NotFoundException('Track not found in this playlist');

      if (moved.version !== dto.expectedVersion) {
        const current = await tx.playlistTrack.findUnique({
          where: { id: playlistTrackId },
          include: { track: true },
        });
        throw new ConflictException({
          message:
            'This track was modified concurrently. Re-apply your move on top of the current state.',
          current,
        });
      }

      const all = await tx.playlistTrack.findMany({
        where: { playlistId },
        orderBy: { position: 'asc' },
      });
      const without = all.filter((t) => t.id !== playlistTrackId);
      const targetIndex = Math.max(0, Math.min(dto.position, without.length));
      without.splice(targetIndex, 0, moved);

      await Promise.all(
        without.map((t, idx) =>
          tx.playlistTrack.update({
            where: { id: t.id },
            data:
              t.id === playlistTrackId
                ? { position: idx, version: { increment: 1 } }
                : { position: idx },
          }),
        ),
      );

      return tx.playlistTrack.findMany({
        where: { playlistId },
        include: { track: true },
        orderBy: { position: 'asc' },
      });
    });

    this.events.emit('playlist.reordered', { playlistId, tracks: updated });
    return updated;
  }
}
