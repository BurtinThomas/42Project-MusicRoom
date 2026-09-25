import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventDetailDto } from '../../events/dto/event.dto';
import { PlaylistDetailDto } from '../../playlists/dto/playlist.dto';

export class SnapshotDto {
  @ApiProperty({ description: 'When the snapshot was taken' })
  serverTime!: Date;

  @ApiProperty({ type: [EventDetailDto] })
  events!: EventDetailDto[];

  @ApiProperty({ type: [PlaylistDetailDto] })
  playlists!: PlaylistDetailDto[];
}

export class ReplayResultDto {
  @ApiProperty({ description: 'Id of the replayed action' })
  id!: string;

  @ApiProperty({ enum: ['applied', 'conflict', 'error'] })
  status!: 'applied' | 'conflict' | 'error';

  @ApiPropertyOptional({ description: 'Response of the action when applied' })
  result?: unknown;

  @ApiPropertyOptional({ description: 'Why the server refused the action' })
  error?: unknown;
}
