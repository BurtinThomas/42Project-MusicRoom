import { ApiProperty } from '@nestjs/swagger';

export class TokenPairDto {
  @ApiProperty({
    description: 'JWT to send as `Authorization: Bearer <token>`',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Opaque single-use token for POST /auth/refresh',
  })
  refreshToken!: string;

  @ApiProperty({ example: '15m', description: 'Access token lifetime' })
  expiresIn!: string;
}
