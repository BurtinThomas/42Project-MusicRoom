import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { SuggestTrackDto } from './dto/suggest-track.dto';
import { VoteDto } from './dto/vote.dto';
import { EventsService } from './events.service';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    list(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        visibility: import(".prisma/client").$Enums.Visibility;
        voteLicense: import(".prisma/client").$Enums.VoteLicense;
        locationLat: number | null;
        locationLng: number | null;
        locationRadiusM: number | null;
        voteWindowStart: Date | null;
        voteWindowEnd: Date | null;
        ownerId: string;
    }[]>;
    create(user: AuthenticatedUser, dto: CreateEventDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        visibility: import(".prisma/client").$Enums.Visibility;
        voteLicense: import(".prisma/client").$Enums.VoteLicense;
        locationLat: number | null;
        locationLng: number | null;
        locationRadiusM: number | null;
        voteWindowStart: Date | null;
        voteWindowEnd: Date | null;
        ownerId: string;
    }>;
    getDetail(user: AuthenticatedUser, id: string): Promise<{
        event: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            visibility: import(".prisma/client").$Enums.Visibility;
            voteLicense: import(".prisma/client").$Enums.VoteLicense;
            locationLat: number | null;
            locationLng: number | null;
            locationRadiusM: number | null;
            voteWindowStart: Date | null;
            voteWindowEnd: Date | null;
            ownerId: string;
        };
        queue: ({
            track: {
                id: string;
                title: string;
                artist: string;
                durationMs: number | null;
                externalRef: string | null;
            };
            _count: {
                votes: number;
            };
        } & {
            id: string;
            createdAt: Date;
            score: number;
            playedAt: Date | null;
            eventId: string;
            trackId: string;
            addedById: string;
        })[];
        history: ({
            track: {
                id: string;
                title: string;
                artist: string;
                durationMs: number | null;
                externalRef: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            score: number;
            playedAt: Date | null;
            eventId: string;
            trackId: string;
            addedById: string;
        })[];
    }>;
    invite(user: AuthenticatedUser, id: string, dto: InviteUserDto): Promise<{
        id: string;
        eventId: string;
        userId: string;
    }>;
    suggestTrack(user: AuthenticatedUser, id: string, dto: SuggestTrackDto): Promise<{
        track: {
            id: string;
            title: string;
            artist: string;
            durationMs: number | null;
            externalRef: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        score: number;
        playedAt: Date | null;
        eventId: string;
        trackId: string;
        addedById: string;
    }>;
    vote(user: AuthenticatedUser, id: string, eventTrackId: string, dto: VoteDto): Promise<{
        track: {
            id: string;
            title: string;
            artist: string;
            durationMs: number | null;
            externalRef: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        score: number;
        playedAt: Date | null;
        eventId: string;
        trackId: string;
        addedById: string;
    }>;
    unvote(user: AuthenticatedUser, id: string, eventTrackId: string): Promise<{
        track: {
            id: string;
            title: string;
            artist: string;
            durationMs: number | null;
            externalRef: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        score: number;
        playedAt: Date | null;
        eventId: string;
        trackId: string;
        addedById: string;
    }>;
    advance(user: AuthenticatedUser, id: string): Promise<{
        track: {
            id: string;
            title: string;
            artist: string;
            durationMs: number | null;
            externalRef: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        score: number;
        playedAt: Date | null;
        eventId: string;
        trackId: string;
        addedById: string;
    }>;
}
