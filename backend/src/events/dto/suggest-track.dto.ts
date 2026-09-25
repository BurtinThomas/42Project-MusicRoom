import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SuggestTrackDto {
  @ApiProperty({ example: 'Around the World' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'Daft Punk' })
  @IsString()
  @MinLength(1)
  artist!: string;
}
