import { ApiProperty } from '@nestjs/swagger';
import { EditLicense, Visibility } from '@prisma/client';
import { TrackDto } from '../../common/dto/track.dto';

export class PlaylistDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ example: 'Friday mix' })
  name!: string;

  @ApiProperty({ enum: Visibility })
  visibility!: Visibility;

  @ApiProperty({ enum: EditLicense })
  editLicense!: EditLicense;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PlaylistTrackDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  playlistId!: string;

  @ApiProperty({ format: 'uuid' })
  trackId!: string;

  @ApiProperty({ description: '0-based position in the playlist' })
  position!: number;

  @ApiProperty({ format: 'uuid' })
  addedById!: string;

  @ApiProperty({
    description:
      'Incremented each time the track is moved; send it back as expectedVersion',
  })
  version!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: TrackDto })
  track!: TrackDto;
}

export class PlaylistDetailDto {
  @ApiProperty({ type: PlaylistDto })
  playlist!: PlaylistDto;

  @ApiProperty({ type: [PlaylistTrackDto], description: 'Ordered by position' })
  tracks!: PlaylistTrackDto[];
}

export class PlaylistInviteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  playlistId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;
}
