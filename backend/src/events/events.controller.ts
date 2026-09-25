import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InviteUserDto } from '../common/dto/invite-user.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import {
  EventDetailDto,
  EventDto,
  EventInviteDto,
  EventTrackDto,
} from './dto/event.dto';
import { SuggestTrackDto } from './dto/suggest-track.dto';
import { VoteDto } from './dto/vote.dto';
import { EventsService } from './events.service';

@ApiTags('events (Music Track Vote)')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOkResponse({
    type: [EventDto],
    description:
      'Public events, plus private ones the caller owns or is invited to',
  })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listVisible(user.id);
  }

  @Post()
  @ApiCreatedResponse({ type: EventDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: EventDetailDto })
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.getDetail(user.id, id);
  }

  @Post(':id/invites')
  @ApiCreatedResponse({ type: EventInviteDto, description: 'Owner only' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.eventsService.invite(user.id, id, dto.userId);
  }

  @Post(':id/tracks')
  @ApiCreatedResponse({ type: EventTrackDto })
  suggestTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuggestTrackDto,
  ) {
    return this.eventsService.suggestTrack(user.id, id, dto);
  }

  @Post(':id/tracks/:eventTrackId/vote')
  @ApiCreatedResponse({
    type: EventTrackDto,
    description: '409 if the caller already voted for this track',
  })
  vote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('eventTrackId') eventTrackId: string,
    @Body() dto: VoteDto,
  ) {
    return this.eventsService.vote(user.id, id, eventTrackId, dto);
  }

  @Delete(':id/tracks/:eventTrackId/vote')
  @ApiOkResponse({ type: EventTrackDto })
  unvote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('eventTrackId') eventTrackId: string,
  ) {
    return this.eventsService.unvote(user.id, id, eventTrackId);
  }

  @Post(':id/advance')
  @ApiCreatedResponse({
    type: EventTrackDto,
    description: 'Owner only: marks the most voted track as played',
  })
  advance(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.advance(user.id, id);
  }
}
