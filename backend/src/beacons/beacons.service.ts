import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Visibility } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { SetEventBeaconDto } from './dto/beacon.dto';

@Injectable()
export class BeaconsService {
  constructor(private readonly prisma: PrismaService) {}

  async setForEvent(ownerId: string, eventId: string, dto: SetEventBeaconDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.ownerId !== ownerId)
      throw new ForbiddenException('Only the owner can set a beacon');

    return this.prisma.eventBeacon.upsert({
      where: { eventId },
      create: { eventId, uuid: dto.uuid, major: dto.major, minor: dto.minor },
      update: { uuid: dto.uuid, major: dto.major, minor: dto.minor },
    });
  }

  async scan(uuid: string, major: number, minor: number) {
    const beacon = await this.prisma.eventBeacon.findUnique({
      where: { uuid_major_minor: { uuid, major, minor } },
      include: {
        event: {
          include: {
            tracks: {
              where: { playedAt: null },
              orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
              take: 1,
              include: { track: true },
            },
          },
        },
      },
    });
    if (!beacon)
      throw new NotFoundException('No event registered for this beacon');
    if (beacon.event.visibility !== Visibility.PUBLIC) {
      throw new NotFoundException('No event registered for this beacon');
    }

    return {
      eventId: beacon.event.id,
      name: beacon.event.name,
      currentTopTrack: beacon.event.tracks[0]?.track ?? null,
    };
  }
}
