import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export const SYNC_ACTION_TYPES = [
  'event.suggestTrack',
  'event.vote',
  'event.unvote',
  'event.advance',
  'playlist.addTrack',
  'playlist.removeTrack',
  'playlist.moveTrack',
] as const;
export type SyncActionType = (typeof SYNC_ACTION_TYPES)[number];

export class OfflineAction {
  @ApiProperty({
    description:
      'Client-generated id (e.g. local outbox row uuid), echoed back in the result',
  })
  @IsString()
  id!: string;

  @ApiProperty({ enum: SYNC_ACTION_TYPES })
  @IsIn(SYNC_ACTION_TYPES)
  type!: SyncActionType;

  @ApiProperty({ description: 'Action-specific payload' })
  @IsObject()
  payload!: Record<string, any>;
}

export class ReplayActionsDto {
  @ApiProperty({ type: [OfflineAction] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineAction)
  actions!: OfflineAction[];
}
