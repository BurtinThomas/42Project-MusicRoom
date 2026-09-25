import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event, VoteLicense, Visibility } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { distanceMeters } from '../common/utils/geo';
import { CreateEventDto } from './dto/create-event.dto';
import { SuggestTrackDto } from './dto/suggest-track.dto';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async create(ownerId: string, dto: CreateEventDto) {
    if (dto.voteLicense === VoteLicense.LOCATION_TIME) {
      this.assertValidLocationTime(dto);
    }
    return this.prisma.event.create({
      data: {
        ownerId,
        name: dto.name,
        visibility: dto.visibility ?? Visibility.PUBLIC,
        voteLicense: dto.voteLicense ?? VoteLicense.OPEN,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationRadiusM: dto.locationRadiusM,
        voteWindowStart: dto.voteWindowStart
          ? new Date(dto.voteWindowStart)
          : undefined,
        voteWindowEnd: dto.voteWindowEnd
          ? new Date(dto.voteWindowEnd)
          : undefined,
      },
    });
  }

  private assertValidLocationTime(dto: CreateEventDto): void {
    if (
      dto.locationLat == null ||
      dto.locationLng == null ||
      dto.locationRadiusM == null
    ) {
      throw new BadRequestException(
        'A location/time license needs a location (lat, lng, radius)',
      );
    }
    if (!dto.voteWindowStart || !dto.voteWindowEnd) {
      throw new BadRequestException(
        'A location/time license needs a voting window (start and end)',
      );
    }
    if (new Date(dto.voteWindowStart) >= new Date(dto.voteWindowEnd)) {
      throw new BadRequestException(
        'The voting window must end after it starts',
      );
    }
  }

  async listVisible(userId: string) {
    return this.prisma.event.findMany({
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

  private async getOrThrow(eventId: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private async canView(event: Event, userId: string): Promise<boolean> {
    if (event.visibility === Visibility.PUBLIC) return true;
    if (event.ownerId === userId) return true;
    const invite = await this.prisma.eventInvite.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });
    return !!invite;
  }

  async getDetail(userId: string, eventId: string) {
    const event = await this.getOrThrow(eventId);
    const visible = await this.canView(event, userId);
    if (!visible) throw new ForbiddenException('This event is private');

    const queued = await this.prisma.eventTrack.findMany({
      where: { eventId, playedAt: null },
      include: {
        track: true,
        votes: { where: { userId }, select: { id: true } },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    });
    const tracks = queued.map(({ votes, ...et }) => ({
      ...et,
      votedByMe: votes.length > 0,
    }));

    const history = await this.prisma.eventTrack.findMany({
      where: { eventId, playedAt: { not: null } },
      include: { track: true },
      orderBy: { playedAt: 'desc' },
      take: 20,
    });

    return { event, queue: tracks, history };
  }

  async invite(ownerId: string, eventId: string, userId: string) {
    const event = await this.getOrThrow(eventId);
    if (event.ownerId !== ownerId)
      throw new ForbiddenException('Only the owner can invite users');
    const invitee = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!invitee) throw new NotFoundException('User not found');
    return this.prisma.eventInvite.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
  }

  async suggestTrack(userId: string, eventId: string, dto: SuggestTrackDto) {
    const event = await this.getOrThrow(eventId);
    const visible = await this.canView(event, userId);
    if (!visible) throw new ForbiddenException('This event is private');

    const track = await this.prisma.track.create({
      data: { title: dto.title, artist: dto.artist },
    });

    const eventTrack = await this.prisma.eventTrack.create({
      data: { eventId, trackId: track.id, addedById: userId },
      include: { track: true },
    });

    this.events.emit('event.track.added', { eventId, eventTrack });
    return eventTrack;
  }

  async vote(
    userId: string,
    eventId: string,
    eventTrackId: string,
    dto: VoteDto,
  ) {
    const event = await this.getOrThrow(eventId);
    await this.assertCanVote(event, userId, dto);

    const eventTrack = await this.prisma.eventTrack.findFirst({
      where: { id: eventTrackId, eventId },
    });
    if (!eventTrack)
      throw new NotFoundException('Track not found in this event');
    if (eventTrack.playedAt)
      throw new BadRequestException('This track has already been played');

    try {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.vote.create({ data: { eventTrackId, userId } }),
        this.prisma.eventTrack.update({
          where: { id: eventTrackId },
          data: { score: { increment: 1 } },
          include: { track: true },
        }),
      ]);

      this.events.emit('event.vote.changed', { eventId, eventTrack: updated });
      return updated;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('You already voted for this track');
      }
      throw err;
    }
  }

  async unvote(userId: string, eventId: string, eventTrackId: string) {
    const eventTrack = await this.prisma.eventTrack.findFirst({
      where: { id: eventTrackId, eventId },
    });
    if (!eventTrack)
      throw new NotFoundException('Track not found in this event');
    if (eventTrack.playedAt)
      throw new BadRequestException('This track has already been played');

    const updated = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.vote.deleteMany({
        where: { eventTrackId, userId },
      });
      if (count === 0)
        throw new NotFoundException('You have not voted for this track');
      return tx.eventTrack.update({
        where: { id: eventTrackId },
        data: { score: { decrement: 1 } },
        include: { track: true },
      });
    });

    this.events.emit('event.vote.changed', { eventId, eventTrack: updated });
    return updated;
  }

  async advance(userId: string, eventId: string) {
    const event = await this.getOrThrow(eventId);
    this.assertCanControl(event, userId);

    const next = await this.prisma.eventTrack.findFirst({
      where: { eventId, playedAt: null },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      include: { track: true },
    });
    if (!next) throw new NotFoundException('Queue is empty');

    const { count } = await this.prisma.eventTrack.updateMany({
      where: { id: next.id, playedAt: null },
      data: { playedAt: new Date() },
    });
    if (count === 0)
      throw new ConflictException('This track was just played, refresh');

    const updated = await this.prisma.eventTrack.findUniqueOrThrow({
      where: { id: next.id },
      include: { track: true },
    });
    this.events.emit('event.track.played', { eventId, eventTrack: updated });
    return updated;
  }

  private assertCanControl(event: Event, userId: string): void {
    if (event.ownerId !== userId)
      throw new ForbiddenException(
        'You do not control playback for this event',
      );
  }

  private async assertCanVote(
    event: Event,
    userId: string,
    dto: VoteDto,
  ): Promise<void> {
    const visible = await this.canView(event, userId);
    if (!visible) throw new ForbiddenException('This event is private');
    if (event.ownerId === userId) return;

    if (event.voteLicense === VoteLicense.OPEN) return;

    if (event.voteLicense === VoteLicense.INVITE_ONLY) {
      const invite = await this.prisma.eventInvite.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
      });
      if (!invite)
        throw new ForbiddenException(
          'Only invited users can vote on this event',
        );
      return;
    }

    if (event.voteLicense === VoteLicense.LOCATION_TIME) {
      const now = new Date();
      if (event.voteWindowStart && now < event.voteWindowStart) {
        throw new ForbiddenException('Voting has not opened yet');
      }
      if (event.voteWindowEnd && now > event.voteWindowEnd) {
        throw new ForbiddenException('Voting has closed');
      }
      if (
        event.locationLat == null ||
        event.locationLng == null ||
        event.locationRadiusM == null
      ) {
        return;
      }
      if (dto.lat == null || dto.lng == null) {
        throw new BadRequestException(
          'Your location is required to vote on this event',
        );
      }
      const distance = distanceMeters(
        event.locationLat,
        event.locationLng,
        dto.lat,
        dto.lng,
      );
      if (distance > event.locationRadiusM) {
        throw new ForbiddenException('You are too far from the event to vote');
      }
    }
  }
}
