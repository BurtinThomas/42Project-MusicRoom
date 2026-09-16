import { EventsService } from '../events/events.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { OfflineAction } from './dto/replay-actions.dto';
export interface ReplayResult {
    id: string;
    status: 'applied' | 'conflict' | 'error';
    result?: unknown;
    error?: unknown;
}
export declare class SyncService {
    private readonly eventsService;
    private readonly playlistsService;
    constructor(eventsService: EventsService, playlistsService: PlaylistsService);
    snapshot(userId: string): Promise<{
        serverTime: string;
        events: {
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
        }[];
        playlists: {
            playlist: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                visibility: import(".prisma/client").$Enums.Visibility;
                ownerId: string;
                editLicense: import(".prisma/client").$Enums.EditLicense;
                requiresPaidPlan: boolean;
            };
            tracks: ({
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
                updatedAt: Date;
                trackId: string;
                addedById: string;
                version: number;
                position: number;
                playlistId: string;
            })[];
        }[];
    }>;
    replay(userId: string, actions: OfflineAction[]): Promise<ReplayResult[]>;
    private apply;
}
