import { IsUUID } from 'class-validator';
import { SuggestTrackDto } from '../../events/dto/suggest-track.dto';
import { VoteDto } from '../../events/dto/vote.dto';
import { AddPlaylistTrackDto } from '../../playlists/dto/add-track.dto';
import { MovePlaylistTrackDto } from '../../playlists/dto/move-track.dto';

export class SuggestTrackAction extends SuggestTrackDto {
  @IsUUID()
  eventId!: string;
}

export class VoteAction extends VoteDto {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  eventTrackId!: string;
}

export class UnvoteAction {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  eventTrackId!: string;
}

export class AddTrackAction extends AddPlaylistTrackDto {
  @IsUUID()
  playlistId!: string;
}

export class RemoveTrackAction {
  @IsUUID()
  playlistId!: string;

  @IsUUID()
  playlistTrackId!: string;
}

export class MoveTrackAction extends MovePlaylistTrackDto {
  @IsUUID()
  playlistId!: string;

  @IsUUID()
  playlistTrackId!: string;
}
