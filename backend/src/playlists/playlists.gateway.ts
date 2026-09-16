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
import { PlaylistsService } from './playlists.service';

@WebSocketGateway({ namespace: '/ws/playlists', cors: { origin: '*' } })
export class PlaylistsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly playlistsService: PlaylistsService,
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

  @SubscribeMessage('playlist:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() playlistId: string,
  ) {
    const userId = (client.data as any).userId;
    try {
      await this.playlistsService.getDetail(userId, playlistId);
      client.join(`playlist:${playlistId}`);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Forbidden' };
    }
  }

  @SubscribeMessage('playlist:leave')
  leave(@ConnectedSocket() client: Socket, @MessageBody() playlistId: string) {
    client.leave(`playlist:${playlistId}`);
    return { ok: true };
  }

  @OnEvent('playlist.track.added')
  onTrackAdded(payload: { playlistId: string; playlistTrack: unknown }) {
    this.server
      .to(`playlist:${payload.playlistId}`)
      .emit('track:added', payload.playlistTrack);
  }

  @OnEvent('playlist.track.removed')
  onTrackRemoved(payload: { playlistId: string; playlistTrackId: string }) {
    this.server
      .to(`playlist:${payload.playlistId}`)
      .emit('track:removed', { playlistTrackId: payload.playlistTrackId });
  }

  @OnEvent('playlist.reordered')
  onReordered(payload: { playlistId: string; tracks: unknown }) {
    this.server
      .to(`playlist:${payload.playlistId}`)
      .emit('reordered', payload.tracks);
  }
}
