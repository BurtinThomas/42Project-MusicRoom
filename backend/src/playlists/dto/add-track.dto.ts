import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class AddPlaylistTrackDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  artist!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  durationMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiPropertyOptional({
    description: 'Position to insert at; defaults to end of list',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}
