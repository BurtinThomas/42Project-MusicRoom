import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';

@WebSocketGateway({ namespace: '/ws/events', cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly eventsService: EventsService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      (client.data as any).userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('event:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() eventId: string,
  ) {
    const userId = (client.data as any).userId;
    try {
      await this.eventsService.getDetail(userId, eventId);
      client.join(`event:${eventId}`);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Forbidden' };
    }
  }

  @SubscribeMessage('event:leave')
  leave(@ConnectedSocket() client: Socket, @MessageBody() eventId: string) {
    client.leave(`event:${eventId}`);
    return { ok: true };
  }

  @OnEvent('event.track.added')
  onTrackAdded(payload: { eventId: string; eventTrack: unknown }) {
    this.server
      .to(`event:${payload.eventId}`)
      .emit('track:added', payload.eventTrack);
  }

  @OnEvent('event.vote.changed')
  onVoteChanged(payload: { eventId: string; eventTrack: unknown }) {
    this.server
      .to(`event:${payload.eventId}`)
      .emit('vote:changed', payload.eventTrack);
  }

  @OnEvent('event.track.played')
  onTrackPlayed(payload: { eventId: string; eventTrack: unknown }) {
    this.server
      .to(`event:${payload.eventId}`)
      .emit('track:played', payload.eventTrack);
  }
}
