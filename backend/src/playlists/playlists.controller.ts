import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AddPlaylistTrackDto } from './dto/add-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { InviteUserDto } from '../events/dto/invite-user.dto';
import { MovePlaylistTrackDto } from './dto/move-track.dto';
import { PlaylistsService } from './playlists.service';

@ApiTags('playlists (Music Playlist Editor)')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.playlistsService.listVisible(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }

  @Get(':id')
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.playlistsService.getDetail(user.id, id);
  }

  @Post(':id/invites')
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.playlistsService.invite(user.id, id, dto.userId);
  }

  @Post(':id/tracks')
  addTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddPlaylistTrackDto,
  ) {
    return this.playlistsService.addTrack(user.id, id, dto);
  }

  @Delete(':id/tracks/:trackId')
  removeTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(user.id, id, trackId);
  }

  @Put(':id/tracks/:trackId/position')
  moveTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @Body() dto: MovePlaylistTrackDto,
  ) {
    return this.playlistsService.moveTrack(user.id, id, trackId, dto);
  }
}
