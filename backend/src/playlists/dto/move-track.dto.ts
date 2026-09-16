import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class MovePlaylistTrackDto {
  @ApiProperty({ description: 'New position (0-based)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;

  @ApiProperty({
    description:
      'The version of the track as last read by the client. Used for optimistic ' +
      'concurrency: if the track was modified concurrently, the request is rejected ' +
      'with 409 Conflict and the current state, instead of silently overwriting it.',
  })
  @Type(() => Number)
  @IsInt()
  expectedVersion!: number;
}
