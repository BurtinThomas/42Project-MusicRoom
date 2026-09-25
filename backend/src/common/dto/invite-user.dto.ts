import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InviteUserDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;
}
