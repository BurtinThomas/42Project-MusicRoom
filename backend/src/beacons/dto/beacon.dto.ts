import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { VoteLicense } from '@prisma/client';
import { TrackDto } from '../../common/dto/track.dto';

export class SetEventBeaconDto {
  @ApiProperty({ description: 'iBeacon proximity UUID' })
  @IsString()
  uuid!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  major!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minor!: number;
}

export class ScanBeaconDto extends SetEventBeaconDto {}

export class EventBeaconDto extends SetEventBeaconDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;
}

export class NearbyEventDto {
  @ApiProperty({ format: 'uuid', description: 'Open it with GET /events/{id}' })
  eventId!: string;

  @ApiProperty({ example: 'Rooftop party' })
  name!: string;

  @ApiProperty({ enum: VoteLicense, description: 'Who can vote there' })
  voteLicense!: VoteLicense;

  @ApiProperty({
    type: [TrackDto],
    description: 'Next tracks in the queue, to get an idea of the music',
  })
  upNext!: TrackDto[];
}
