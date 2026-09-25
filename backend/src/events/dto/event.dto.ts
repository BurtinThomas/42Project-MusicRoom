import { ApiProperty } from '@nestjs/swagger';
import { Visibility, VoteLicense } from '@prisma/client';
import { TrackDto } from '../../common/dto/track.dto';

export class EventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ example: 'Rooftop party' })
  name!: string;

  @ApiProperty({ enum: Visibility })
  visibility!: Visibility;

  @ApiProperty({ enum: VoteLicense })
  voteLicense!: VoteLicense;

  @ApiProperty({ type: Number, nullable: true })
  locationLat!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  locationLng!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  locationRadiusM!: number | null;

  @ApiProperty({ type: Date, nullable: true })
  voteWindowStart!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  voteWindowEnd!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class EventTrackDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ format: 'uuid' })
  trackId!: string;

  @ApiProperty({ format: 'uuid' })
  addedById!: string;

  @ApiProperty({ description: 'Number of votes' })
  score!: number;

  @ApiProperty({ type: Date, nullable: true })
  playedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: TrackDto })
  track!: TrackDto;
}

export class QueuedTrackDto extends EventTrackDto {
  @ApiProperty({ description: 'Whether the caller voted for this track' })
  votedByMe!: boolean;
}

export class EventDetailDto {
  @ApiProperty({ type: EventDto })
  event!: EventDto;

  @ApiProperty({
    type: [QueuedTrackDto],
    description: 'Tracks not played yet, most voted first',
  })
  queue!: QueuedTrackDto[];

  @ApiProperty({
    type: [EventTrackDto],
    description: 'Last 20 played tracks, most recent first',
  })
  history!: EventTrackDto[];
}

export class EventInviteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;
}
