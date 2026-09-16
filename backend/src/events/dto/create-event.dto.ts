import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { Visibility, VoteLicense } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ enum: Visibility, default: Visibility.PUBLIC })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({ enum: VoteLicense, default: VoteLicense.OPEN })
  @IsOptional()
  @IsEnum(VoteLicense)
  voteLicense?: VoteLicense;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  locationLng?: number;

  @ApiPropertyOptional({
    description: 'Radius in meters for LOCATION_TIME license',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  locationRadiusM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  voteWindowStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  voteWindowEnd?: string;
}
