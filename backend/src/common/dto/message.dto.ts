import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ example: 'Email verified, you can now log in.' })
  message!: string;
}
