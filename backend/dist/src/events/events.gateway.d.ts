import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
export declare class EventsGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly eventsService;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, eventsService: EventsService);
    handleConnection(client: Socket): Promise<void>;
    join(client: Socket, eventId: string): Promise<{
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
    leave(client: Socket, eventId: string): {
        ok: boolean;
    };
    onTrackAdded(payload: {
        eventId: string;
        eventTrack: unknown;
    }): void;
    onVoteChanged(payload: {
        eventId: string;
        eventTrack: unknown;
    }): void;
    onTrackPlayed(payload: {
        eventId: string;
        eventTrack: unknown;
    }): void;
}
