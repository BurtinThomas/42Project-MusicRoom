import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ReplayActionsDto } from './dto/replay-actions.dto';
import { SyncService } from './sync.service';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    snapshot(user: AuthenticatedUser): Promise<{
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
    replay(user: AuthenticatedUser, dto: ReplayActionsDto): Promise<import("./sync.service").ReplayResult[]>;
}
