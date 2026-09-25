import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EditLicense, SubscriptionPlan, Visibility } from '@prisma/client';
import { FREE_PLAYLIST_LIMIT, PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  function makeService(prismaOverrides: any) {
    const prisma = {
      playlist: { findUnique: jest.fn() },
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

  function creationTx(plan: SubscriptionPlan, owned: number) {
    return {
      $executeRaw: jest.fn(),
      user: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ subscriptionPlan: plan }),
      },
      playlist: {
        count: jest.fn().mockResolvedValue(owned),
        create: jest.fn().mockResolvedValue({ id: 'pl1' }),
      },
    };
  }

  it('creates a public, open-edit playlist by default', async () => {
    const tx = creationTx(SubscriptionPlan.FREE, 0);
    const { service } = makeService({
      $transaction: jest.fn((cb: any) => cb(tx)),
    });

    await service.create('user1', { name: 'Party mix' });

    expect(tx.playlist.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'user1',
        name: 'Party mix',
        visibility: Visibility.PUBLIC,
        editLicense: EditLicense.OPEN,
      },
    });
  });

  it('refuses a playlist beyond the Free plan limit', async () => {
    const tx = creationTx(SubscriptionPlan.FREE, FREE_PLAYLIST_LIMIT);
    const { service } = makeService({
      $transaction: jest.fn((cb: any) => cb(tx)),
    });

    await expect(
      service.create('user1', { name: 'One too many' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.playlist.create).not.toHaveBeenCalled();
  });

  it('has no playlist limit on the Paid plan', async () => {
    const tx = creationTx(SubscriptionPlan.PAID, FREE_PLAYLIST_LIMIT + 10);
    const { service } = makeService({
      $transaction: jest.fn((cb: any) => cb(tx)),
    });

    await expect(service.create('user1', { name: 'More' })).resolves.toEqual({
      id: 'pl1',
    });
  });

  it('rejects a move whose expectedVersion is stale (concurrent edit)', async () => {
    const tx = {
      $executeRaw: jest.fn(),
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
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.playlistTrack.findFirst.mock.invocationCallOrder[0],
    );
  });

  it('refuses to invite a user that does not exist', async () => {
    const { service } = makeService({
      playlist: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'pl1', ownerId: 'user1' }),
      },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      service.invite('user1', 'pl1', 'ghost'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
