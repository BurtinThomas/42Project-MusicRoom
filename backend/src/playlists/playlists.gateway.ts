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
import { authenticateSocket } from '../common/ws/authenticate-socket';
import { PlaylistsService } from './playlists.service';

@WebSocketGateway({ namespace: '/ws/playlists', cors: { origin: '*' } })
export class PlaylistsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  handleConnection(client: Socket) {
    return authenticateSocket(client, this.jwt, this.config);
  }

  @SubscribeMessage('playlist:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() playlistId: string,
  ) {
    const userId = client.data.userId;
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
      .emit('track:removed', payload);
  }

  @OnEvent('playlist.reordered')
  onReordered(payload: { playlistId: string; tracks: unknown }) {
    this.server.to(`playlist:${payload.playlistId}`).emit('reordered', payload);
  }
}
