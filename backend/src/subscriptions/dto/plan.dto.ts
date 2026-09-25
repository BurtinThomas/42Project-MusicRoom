import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';

export class PlanDto {
  @ApiProperty({ enum: SubscriptionPlan })
  plan!: SubscriptionPlan;

  @ApiProperty({ description: 'Playlists the user currently owns' })
  playlistsOwned!: number;

  @ApiProperty({
    example: 3,
    description: 'Max playlists a Free account can own (Paid is unlimited)',
  })
  freePlaylistLimit!: number;
}
