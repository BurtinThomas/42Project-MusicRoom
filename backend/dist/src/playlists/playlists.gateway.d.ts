import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlaylistsService } from './playlists.service';
export declare class PlaylistsGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly playlistsService;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, playlistsService: PlaylistsService);
    handleConnection(client: Socket): Promise<void>;
    join(client: Socket, playlistId: string): Promise<{
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
    leave(client: Socket, playlistId: string): {
        ok: boolean;
    };
    onTrackAdded(payload: {
        playlistId: string;
        playlistTrack: unknown;
    }): void;
    onTrackRemoved(payload: {
        playlistId: string;
        playlistTrackId: string;
    }): void;
    onReordered(payload: {
        playlistId: string;
        tracks: unknown;
    }): void;
}
