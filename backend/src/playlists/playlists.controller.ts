import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InviteUserDto } from '../common/dto/invite-user.dto';
import { MessageDto } from '../common/dto/message.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AddPlaylistTrackDto } from './dto/add-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { MovePlaylistTrackDto } from './dto/move-track.dto';
import {
  PlaylistDetailDto,
  PlaylistDto,
  PlaylistInviteDto,
  PlaylistTrackDto,
} from './dto/playlist.dto';
import { PlaylistsService } from './playlists.service';

@ApiTags('playlists (Music Playlist Editor)')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOkResponse({
    type: [PlaylistDto],
    description:
      'Public playlists, plus private ones the caller owns or is invited to',
  })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.playlistsService.listVisible(user.id);
  }

  @Post()
  @ApiCreatedResponse({
    type: PlaylistDto,
    description: '403 when a Free account already owns its maximum',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: PlaylistDetailDto })
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.playlistsService.getDetail(user.id, id);
  }

  @Post(':id/invites')
  @ApiCreatedResponse({ type: PlaylistInviteDto, description: 'Owner only' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.playlistsService.invite(user.id, id, dto.userId);
  }

  @Post(':id/tracks')
  @ApiCreatedResponse({
    type: PlaylistTrackDto,
    description: 'Appended at the end of the playlist',
  })
  addTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddPlaylistTrackDto,
  ) {
    return this.playlistsService.addTrack(user.id, id, dto);
  }

  @Delete(':id/tracks/:trackId')
  @ApiOkResponse({ type: MessageDto })
  removeTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(user.id, id, trackId);
  }

  @Put(':id/tracks/:trackId/position')
  @ApiOkResponse({
    type: [PlaylistTrackDto],
    description:
      'The whole reordered playlist. 409 with the current track if expectedVersion is stale',
  })
  moveTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @Body() dto: MovePlaylistTrackDto,
  ) {
    return this.playlistsService.moveTrack(user.id, id, trackId, dto);
  }
}
