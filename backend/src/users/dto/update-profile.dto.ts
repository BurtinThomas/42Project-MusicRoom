import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Visible to everyone' })
  @IsOptional()
  @IsObject()
  publicInfo?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Visible to accepted friends only' })
  @IsOptional()
  @IsObject()
  friendsInfo?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Visible to the user only' })
  @IsOptional()
  @IsObject()
  privateInfo?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  musicPreferences?: Record<string, unknown>;
}
