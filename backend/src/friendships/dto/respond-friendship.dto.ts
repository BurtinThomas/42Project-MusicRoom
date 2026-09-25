import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class RespondFriendshipDto {
  @ApiProperty({ description: 'true accepts the request, false declines it' })
  @IsBoolean()
  accept!: boolean;
}
