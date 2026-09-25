import { ApiProperty } from '@nestjs/swagger';
import { FriendshipStatus } from '@prisma/client';

export class UserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  displayName!: string;
}

export class FriendshipDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  requesterId!: string;

  @ApiProperty({ format: 'uuid' })
  addresseeId!: string;

  @ApiProperty({ enum: FriendshipStatus })
  status!: FriendshipStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class FriendshipWithUsersDto extends FriendshipDto {
  @ApiProperty({ type: UserSummaryDto })
  requester!: UserSummaryDto;

  @ApiProperty({ type: UserSummaryDto })
  addressee!: UserSummaryDto;
}
