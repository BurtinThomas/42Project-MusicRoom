import { EventEmitter2 } from '@nestjs/event-emitter';
import { Playlist } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddPlaylistTrackDto } from './dto/add-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { MovePlaylistTrackDto } from './dto/move-track.dto';
export declare class PlaylistsService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    create(ownerId: string, dto: CreatePlaylistDto): Promise<Playlist>;
    listVisible(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        visibility: import(".prisma/client").$Enums.Visibility;
        ownerId: string;
        editLicense: import(".prisma/client").$Enums.EditLicense;
        requiresPaidPlan: boolean;
    }[]>;
    private getOrThrow;
    private canView;
    private assertCanEdit;
    invite(ownerId: string, playlistId: string, userId: string): Promise<{
        id: string;
        userId: string;
        playlistId: string;
    }>;
    getDetail(userId: string, playlistId: string): Promise<{
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
    addTrack(userId: string, playlistId: string, dto: AddPlaylistTrackDto): Promise<{
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
    removeTrack(userId: string, playlistId: string, playlistTrackId: string): Promise<{
        message: string;
    }>;
    moveTrack(userId: string, playlistId: string, playlistTrackId: string, dto: MovePlaylistTrackDto): Promise<({
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
