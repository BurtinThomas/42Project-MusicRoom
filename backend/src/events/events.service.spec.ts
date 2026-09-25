import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { VoteLicense, Visibility } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService', () => {
  function makeService(prismaOverrides: any) {
    const prisma = {
      event: { findUnique: jest.fn() },
      eventInvite: { findUnique: jest.fn() },
      eventTrack: { findFirst: jest.fn(), update: jest.fn() },
      vote: { create: jest.fn() },
      $transaction: jest.fn(),
      ...prismaOverrides,
    };
    const events = { emit: jest.fn() };
    return { service: new EventsService(prisma as any, events as any), prisma };
  }

  it('rejects a vote from a non-invited user when the license is INVITE_ONLY', async () => {
    const { service } = makeService({
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'evt1',
          ownerId: 'owner',
          visibility: Visibility.PUBLIC,
          voteLicense: VoteLicense.INVITE_ONLY,
        }),
      },
      eventInvite: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      service.vote('stranger', 'evt1', 'track1', {} as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('turns a duplicate vote (DB unique violation) into a ConflictException', async () => {
    const { service, prisma } = makeService({
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'evt1',
          ownerId: 'owner',
          visibility: Visibility.PUBLIC,
          voteLicense: VoteLicense.OPEN,
        }),
      },
      eventTrack: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'track1', playedAt: null }),
        update: jest.fn(),
      },
    });
    prisma.$transaction.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.vote('user1', 'evt1', 'track1', {} as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('only lets the event owner advance the queue', async () => {
    const { service } = makeService({
      event: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'evt1', ownerId: 'owner' }),
      },
    });

    await expect(
      service.advance('someone-else', 'evt1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a LOCATION_TIME event without a place and a time window', async () => {
    const { service } = makeService({});

    await expect(
      service.create('owner', {
        name: 'Rooftop',
        voteLicense: VoteLicense.LOCATION_TIME,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a LOCATION_TIME vote from too far away', async () => {
    const now = Date.now();
    const { service } = makeService({
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'evt1',
          ownerId: 'owner',
          visibility: Visibility.PUBLIC,
          voteLicense: VoteLicense.LOCATION_TIME,
          locationLat: 48.8966,
          locationLng: 2.3185,
          locationRadiusM: 200,
          voteWindowStart: new Date(now - 3600_000),
          voteWindowEnd: new Date(now + 3600_000),
        }),
      },
    });

    await expect(
      service.vote('guest', 'evt1', 'track1', { lat: 48.875, lng: 2.3 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a LOCATION_TIME vote outside the time window', async () => {
    const now = Date.now();
    const { service } = makeService({
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'evt1',
          ownerId: 'owner',
          visibility: Visibility.PUBLIC,
          voteLicense: VoteLicense.LOCATION_TIME,
          locationLat: 48.8966,
          locationLng: 2.3185,
          locationRadiusM: 200,
          voteWindowStart: new Date(now + 3600_000),
          voteWindowEnd: new Date(now + 7200_000),
        }),
      },
    });

    await expect(
      service.vote('guest', 'evt1', 'track1', { lat: 48.8966, lng: 2.3185 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
