import { HttpException, Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { OfflineAction } from './dto/replay-actions.dto';

export interface ReplayResult {
  id: string;
  status: 'applied' | 'conflict' | 'error';
  result?: unknown;
  error?: unknown;
}

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
      serverTime: new Date().toISOString(),
      events: eventsDetailed,
      playlists: playlistsDetailed,
    };
  }

  async replay(
    userId: string,
    actions: OfflineAction[],
  ): Promise<ReplayResult[]> {
    const results: ReplayResult[] = [];

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

  private apply(userId: string, action: OfflineAction) {
    const p = action.payload;
    switch (action.type) {
      case 'event.suggestTrack':
        return this.eventsService.suggestTrack(userId, p.eventId, p as any);
      case 'event.vote':
        return this.eventsService.vote(
          userId,
          p.eventId,
          p.eventTrackId,
          p as any,
        );
      case 'event.unvote':
        return this.eventsService.unvote(userId, p.eventId, p.eventTrackId);
      case 'event.advance':
        return this.eventsService.advance(userId, p.eventId);
      case 'playlist.addTrack':
        return this.playlistsService.addTrack(userId, p.playlistId, p as any);
      case 'playlist.removeTrack':
        return this.playlistsService.removeTrack(
          userId,
          p.playlistId,
          p.playlistTrackId,
        );
      case 'playlist.moveTrack':
        return this.playlistsService.moveTrack(
          userId,
          p.playlistId,
          p.playlistTrackId,
          p as any,
        );
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
