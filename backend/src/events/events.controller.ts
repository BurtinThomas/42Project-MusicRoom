import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { SuggestTrackDto } from './dto/suggest-track.dto';
import { VoteDto } from './dto/vote.dto';
import { EventsService } from './events.service';

@ApiTags('events (Music Track Vote)')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listVisible(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.id, dto);
  }

  @Get(':id')
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.getDetail(user.id, id);
  }

  @Post(':id/invites')
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.eventsService.invite(user.id, id, dto.userId);
  }

  @Post(':id/tracks')
  suggestTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuggestTrackDto,
  ) {
    return this.eventsService.suggestTrack(user.id, id, dto);
  }

  @Post(':id/tracks/:eventTrackId/vote')
  vote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('eventTrackId') eventTrackId: string,
    @Body() dto: VoteDto,
  ) {
    return this.eventsService.vote(user.id, id, eventTrackId, dto);
  }

  @Delete(':id/tracks/:eventTrackId/vote')
  unvote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('eventTrackId') eventTrackId: string,
  ) {
    return this.eventsService.unvote(user.id, id, eventTrackId);
  }

  @Post(':id/advance')
  advance(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.advance(user.id, id);
  }
}
