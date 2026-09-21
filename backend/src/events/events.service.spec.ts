import { ConflictException, ForbiddenException } from '@nestjs/common';
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
});
