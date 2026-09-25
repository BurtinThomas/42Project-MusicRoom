import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RequestFriendshipDto {
  @ApiProperty({ format: 'uuid', description: 'Id of the user to befriend' })
  @IsUUID()
  addresseeId!: string;
}
