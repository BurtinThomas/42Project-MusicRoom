import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';

const infoMap = {
  type: 'object',
  additionalProperties: { type: 'string' },
} as const;

export class ProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  displayName!: string;

  @ApiProperty({ ...infoMap, example: { city: 'Paris' } })
  publicInfo!: object;

  @ApiProperty({ ...infoMap, example: { genre: 'House' } })
  musicPreferences!: object;

  @ApiPropertyOptional({
    ...infoMap,
    description: 'Only for the user themself and their accepted friends',
  })
  friendsInfo?: object;

  @ApiPropertyOptional({ ...infoMap, description: 'Only for the user' })
  privateInfo?: object;

  @ApiPropertyOptional({ description: 'Only for the user' })
  email?: string;

  @ApiPropertyOptional({
    enum: AuthProvider,
    isArray: true,
    description: 'Social accounts linked to this user (only for the user)',
  })
  linkedProviders?: AuthProvider[];

  @ApiProperty()
  isSelf!: boolean;
}
