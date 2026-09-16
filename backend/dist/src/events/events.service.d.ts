import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';
import { DelegationsService } from '../delegations/delegations.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SuggestTrackDto } from './dto/suggest-track.dto';
import { VoteDto } from './dto/vote.dto';
export declare class EventsService {
    private readonly prisma;
    private readonly delegations;
    private readonly events;
    constructor(prisma: PrismaService, delegations: DelegationsService, events: EventEmitter2);
    create(ownerId: string, dto: CreateEventDto): Promise<{
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
    listVisible(userId: string): Promise<{
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
    private getOrThrow;
    private canView;
    getDetail(userId: string, eventId: string): Promise<{
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
    invite(ownerId: string, eventId: string, userId: string): Promise<{
        id: string;
        eventId: string;
        userId: string;
    }>;
    suggestTrack(userId: string, eventId: string, dto: SuggestTrackDto): Promise<{
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
    vote(userId: string, eventId: string, eventTrackId: string, dto: VoteDto): Promise<{
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
    unvote(userId: string, eventId: string, eventTrackId: string): Promise<{
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
    advance(userId: string, eventId: string): Promise<{
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
    private assertCanControl;
    private assertCanVote;
}
