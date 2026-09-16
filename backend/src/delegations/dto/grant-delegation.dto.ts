import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GrantDelegationDto {
  @ApiProperty({
    description: 'Device (owned by the caller) whose control is delegated',
  })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ description: 'Friend who receives control' })
  @IsUUID()
  delegateId!: string;
}
