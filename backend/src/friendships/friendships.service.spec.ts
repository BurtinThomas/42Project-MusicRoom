import { FriendshipsService } from './friendships.service';

describe('FriendshipsService', () => {
  it('only exposes id and displayName of the other user', async () => {
    const prisma = {
      friendship: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new FriendshipsService(prisma as any);

    await service.listFor('user1');

    const { include } = prisma.friendship.findMany.mock.calls[0][0];
    const publicUser = { select: { id: true, displayName: true } };
    expect(include).toEqual({ requester: publicUser, addressee: publicUser });
  });
});
