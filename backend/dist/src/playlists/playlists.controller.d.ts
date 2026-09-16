import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AddPlaylistTrackDto } from './dto/add-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { InviteUserDto } from '../events/dto/invite-user.dto';
import { MovePlaylistTrackDto } from './dto/move-track.dto';
import { PlaylistsService } from './playlists.service';
export declare class PlaylistsController {
    private readonly playlistsService;
    constructor(playlistsService: PlaylistsService);
    list(user: AuthenticatedUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        visibility: import(".prisma/client").$Enums.Visibility;
        ownerId: string;
        editLicense: import(".prisma/client").$Enums.EditLicense;
        requiresPaidPlan: boolean;
    }[]>;
    create(user: AuthenticatedUser, dto: CreatePlaylistDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        visibility: import(".prisma/client").$Enums.Visibility;
        ownerId: string;
        editLicense: import(".prisma/client").$Enums.EditLicense;
        requiresPaidPlan: boolean;
    }>;
    getDetail(user: AuthenticatedUser, id: string): Promise<{
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
    }>;
    invite(user: AuthenticatedUser, id: string, dto: InviteUserDto): Promise<{
        id: string;
        userId: string;
        playlistId: string;
    }>;
    addTrack(user: AuthenticatedUser, id: string, dto: AddPlaylistTrackDto): Promise<{
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
    }>;
    removeTrack(user: AuthenticatedUser, id: string, trackId: string): Promise<{
        message: string;
    }>;
    moveTrack(user: AuthenticatedUser, id: string, trackId: string, dto: MovePlaylistTrackDto): Promise<({
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
    })[]>;
}
