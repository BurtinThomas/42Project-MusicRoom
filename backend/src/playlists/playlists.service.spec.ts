import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan, Visibility } from '@prisma/client';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  function makeService(prismaOverrides: any) {
    const prisma = {
      user: { findUniqueOrThrow: jest.fn() },
      playlist: { create: jest.fn(), findUnique: jest.fn() },
      playlistInvite: { findUnique: jest.fn() },
      $transaction: jest.fn(),
      ...prismaOverrides,
    };
    const events = { emit: jest.fn() };
    return {
      service: new PlaylistsService(prisma as any, events as any),
      prisma,
    };
  }

  it('refuses a collaborative (public/open-edit) playlist for a FREE account', async () => {
    const { service } = makeService({
      user: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ subscriptionPlan: SubscriptionPlan.FREE }),
      },
    });

    await expect(
      service.create('user1', {
        name: 'Party mix',
        visibility: Visibility.PUBLIC,
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a collaborative playlist for a PAID account', async () => {
    const { service, prisma } = makeService({
      user: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ subscriptionPlan: SubscriptionPlan.PAID }),
      },
    });
    prisma.playlist.create.mockResolvedValue({ id: 'pl1' });

    await expect(
      service.create('user1', {
        name: 'Party mix',
        visibility: Visibility.PUBLIC,
      } as any),
    ).resolves.toEqual({ id: 'pl1' });
  });

  it('rejects a move whose expectedVersion is stale (concurrent edit)', async () => {
    const tx = {
      playlistTrack: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'pt1', playlistId: 'pl1', version: 2 }),
        findUnique: jest.fn().mockResolvedValue({ id: 'pt1', version: 2 }),
      },
    };
    const { service } = makeService({
      playlist: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'pl1', ownerId: 'user1' }),
      },
      $transaction: jest.fn((cb: any) => cb(tx)),
    });

    await expect(
      service.moveTrack('user1', 'pl1', 'pt1', {
        position: 0,
        expectedVersion: 1,
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
