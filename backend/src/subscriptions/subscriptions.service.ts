import { Injectable } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { FREE_PLAYLIST_LIMIT } from '../playlists/playlists.service';
import { PlanDto } from './dto/plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<PlanDto> {
    const [user, playlistsOwned] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.playlist.count({ where: { ownerId: userId } }),
    ]);
    return {
      plan: user.subscriptionPlan,
      playlistsOwned,
      freePlaylistLimit: FREE_PLAYLIST_LIMIT,
    };
  }

  async change(userId: string, plan: SubscriptionPlan): Promise<PlanDto> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionPlan: plan },
    });
    return this.get(userId);
  }
}
