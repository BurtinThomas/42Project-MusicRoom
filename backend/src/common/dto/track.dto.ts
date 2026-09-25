import { ApiProperty } from '@nestjs/swagger';

export class TrackDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Around the World' })
  title!: string;

  @ApiProperty({ example: 'Daft Punk' })
  artist!: string;
}
