import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async areFriends(userIdA: string, userIdB: string): Promise<boolean> {
    if (userIdA === userIdB) return true;
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
    });
    return !!friendship;
  }

  async request(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('You cannot friend yourself');
    }
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existing)
      throw new ConflictException('A friendship request already exists');

    return this.prisma.friendship.create({
      data: { requesterId, addresseeId },
    });
  }

  async respond(userId: string, friendshipId: string, accept: boolean) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship || friendship.addresseeId !== userId) {
      throw new NotFoundException('Friend request not found');
    }
    if (!accept) {
      return this.prisma.friendship.delete({ where: { id: friendshipId } });
    }
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
    });
  }

  listFor(userId: string) {
    return this.prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: { requester: true, addressee: true },
    });
  }
}
