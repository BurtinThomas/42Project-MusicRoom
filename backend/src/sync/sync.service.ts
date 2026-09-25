import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventsService } from '../events/events.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { OfflineAction } from './dto/replay-actions.dto';
import {
  AddTrackAction,
  MoveTrackAction,
  RemoveTrackAction,
  SuggestTrackAction,
  UnvoteAction,
  VoteAction,
} from './dto/replay-payloads.dto';
import { ReplayResultDto } from './dto/snapshot.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  async snapshot(userId: string) {
    const [events, playlists] = await Promise.all([
      this.eventsService.listVisible(userId),
      this.playlistsService.listVisible(userId),
    ]);

    const [eventsDetailed, playlistsDetailed] = await Promise.all([
      Promise.all(
        events.map((e) => this.eventsService.getDetail(userId, e.id)),
      ),
      Promise.all(
        playlists.map((p) => this.playlistsService.getDetail(userId, p.id)),
      ),
    ]);

    return {
      serverTime: new Date(),
      events: eventsDetailed,
      playlists: playlistsDetailed,
    };
  }

  async replay(
    userId: string,
    actions: OfflineAction[],
  ): Promise<ReplayResultDto[]> {
    const results: ReplayResultDto[] = [];

    for (const action of actions) {
      try {
        const result = await this.apply(userId, action);
        results.push({ id: action.id, status: 'applied', result });
      } catch (err) {
        if (err instanceof HttpException && err.getStatus() === 409) {
          results.push({
            id: action.id,
            status: 'conflict',
            error: err.getResponse(),
          });
        } else if (err instanceof HttpException) {
          results.push({
            id: action.id,
            status: 'error',
            error: err.getResponse(),
          });
        } else {
          results.push({
            id: action.id,
            status: 'error',
            error: 'Unknown error',
          });
        }
      }
    }

    return results;
  }

  private async apply(userId: string, action: OfflineAction) {
    const p = action.payload;
    switch (action.type) {
      case 'event.suggestTrack': {
        const dto = await this.parse(SuggestTrackAction, p);
        return this.eventsService.suggestTrack(userId, dto.eventId, dto);
      }
      case 'event.vote': {
        const dto = await this.parse(VoteAction, p);
        return this.eventsService.vote(
          userId,
          dto.eventId,
          dto.eventTrackId,
          dto,
        );
      }
      case 'event.unvote': {
        const dto = await this.parse(UnvoteAction, p);
        return this.eventsService.unvote(userId, dto.eventId, dto.eventTrackId);
      }
      case 'playlist.addTrack': {
        const dto = await this.parse(AddTrackAction, p);
        return this.playlistsService.addTrack(userId, dto.playlistId, dto);
      }
      case 'playlist.removeTrack': {
        const dto = await this.parse(RemoveTrackAction, p);
        return this.playlistsService.removeTrack(
          userId,
          dto.playlistId,
          dto.playlistTrackId,
        );
      }
      case 'playlist.moveTrack': {
        const dto = await this.parse(MoveTrackAction, p);
        return this.playlistsService.moveTrack(
          userId,
          dto.playlistId,
          dto.playlistTrackId,
          dto,
        );
      }
    }
  }

  private async parse<T extends object>(
    cls: ClassConstructor<T>,
    payload: object,
  ): Promise<T> {
    const dto = plainToInstance(cls, payload);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.flatMap((e) => Object.values(e.constraints ?? {})),
      );
    }
    return dto;
  }
}
