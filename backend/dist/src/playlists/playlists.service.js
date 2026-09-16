"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
let PlaylistsService = class PlaylistsService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async create(ownerId, dto) {
        const visibility = dto.visibility ?? client_1.Visibility.PUBLIC;
        const editLicense = dto.editLicense ?? client_1.EditLicense.OPEN;
        const isCollaborative = visibility === client_1.Visibility.PUBLIC || editLicense === client_1.EditLicense.OPEN;
        if (isCollaborative) {
            const owner = await this.prisma.user.findUniqueOrThrow({
                where: { id: ownerId },
            });
            if (owner.subscriptionPlan !== client_1.SubscriptionPlan.PAID) {
                throw new common_1.ForbiddenException('Collaborative playlists (public or open-edit) require a paid subscription. ' +
                    'Free accounts can create private, owner-only playlists.');
            }
        }
        return this.prisma.playlist.create({
            data: {
                ownerId,
                name: dto.name,
                visibility,
                editLicense,
                requiresPaidPlan: isCollaborative,
            },
        });
    }
    listVisible(userId) {
        return this.prisma.playlist.findMany({
            where: {
                OR: [
                    { visibility: client_1.Visibility.PUBLIC },
                    { ownerId: userId },
                    { invites: { some: { userId } } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOrThrow(playlistId) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist)
            throw new common_1.NotFoundException('Playlist not found');
        return playlist;
    }
    async canView(playlist, userId) {
        if (playlist.visibility === client_1.Visibility.PUBLIC)
            return true;
        if (playlist.ownerId === userId)
            return true;
        const invite = await this.prisma.playlistInvite.findUnique({
            where: { playlistId_userId: { playlistId: playlist.id, userId } },
        });
        return !!invite;
    }
    async assertCanEdit(playlist, userId) {
        const visible = await this.canView(playlist, userId);
        if (!visible)
            throw new common_1.ForbiddenException('This playlist is private');
        if (playlist.ownerId === userId)
            return;
        if (playlist.editLicense === client_1.EditLicense.OPEN)
            return;
        const invite = await this.prisma.playlistInvite.findUnique({
            where: { playlistId_userId: { playlistId: playlist.id, userId } },
        });
        if (!invite)
            throw new common_1.ForbiddenException('Only invited users can edit this playlist');
    }
    async invite(ownerId, playlistId, userId) {
        const playlist = await this.getOrThrow(playlistId);
        if (playlist.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('Only the owner can invite users');
        }
        return this.prisma.playlistInvite.upsert({
            where: { playlistId_userId: { playlistId, userId } },
            create: { playlistId, userId },
            update: {},
        });
    }
    async getDetail(userId, playlistId) {
        const playlist = await this.getOrThrow(playlistId);
        const visible = await this.canView(playlist, userId);
        if (!visible)
            throw new common_1.ForbiddenException('This playlist is private');
        const tracks = await this.prisma.playlistTrack.findMany({
            where: { playlistId },
            include: { track: true },
            orderBy: { position: 'asc' },
        });
        return { playlist, tracks };
    }
    async addTrack(userId, playlistId, dto) {
        const playlist = await this.getOrThrow(playlistId);
        await this.assertCanEdit(playlist, userId);
        return this.prisma.$transaction(async (tx) => {
            const count = await tx.playlistTrack.count({ where: { playlistId } });
            const insertAt = dto.position != null
                ? Math.max(0, Math.min(dto.position, count))
                : count;
            if (insertAt < count) {
                await tx.playlistTrack.updateMany({
                    where: { playlistId, position: { gte: insertAt } },
                    data: { position: { increment: 1 } },
                });
            }
            const track = await tx.track.create({
                data: {
                    title: dto.title,
                    artist: dto.artist,
                    durationMs: dto.durationMs,
                    externalRef: dto.externalRef,
                },
            });
            const playlistTrack = await tx.playlistTrack.create({
                data: {
                    playlistId,
                    trackId: track.id,
                    addedById: userId,
                    position: insertAt,
                },
                include: { track: true },
            });
            this.events.emit('playlist.track.added', { playlistId, playlistTrack });
            return playlistTrack;
        });
    }
    async removeTrack(userId, playlistId, playlistTrackId) {
        const playlist = await this.getOrThrow(playlistId);
        await this.assertCanEdit(playlist, userId);
        await this.prisma.$transaction(async (tx) => {
            const track = await tx.playlistTrack.findFirst({
                where: { id: playlistTrackId, playlistId },
            });
            if (!track)
                throw new common_1.NotFoundException('Track not found in this playlist');
            await tx.playlistTrack.delete({ where: { id: playlistTrackId } });
            await tx.playlistTrack.updateMany({
                where: { playlistId, position: { gt: track.position } },
                data: { position: { decrement: 1 } },
            });
        });
        this.events.emit('playlist.track.removed', { playlistId, playlistTrackId });
        return { message: 'Track removed' };
    }
    async moveTrack(userId, playlistId, playlistTrackId, dto) {
        const playlist = await this.getOrThrow(playlistId);
        await this.assertCanEdit(playlist, userId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const moved = await tx.playlistTrack.findFirst({
                where: { id: playlistTrackId, playlistId },
            });
            if (!moved)
                throw new common_1.NotFoundException('Track not found in this playlist');
            if (moved.version !== dto.expectedVersion) {
                const current = await tx.playlistTrack.findUnique({
                    where: { id: playlistTrackId },
                    include: { track: true },
                });
                throw new common_1.ConflictException({
                    message: 'This track was modified concurrently. Re-apply your move on top of the current state.',
                    current,
                });
            }
            const all = await tx.playlistTrack.findMany({
                where: { playlistId },
                orderBy: { position: 'asc' },
            });
            const without = all.filter((t) => t.id !== playlistTrackId);
            const targetIndex = Math.max(0, Math.min(dto.position, without.length));
            without.splice(targetIndex, 0, moved);
            await Promise.all(without.map((t, idx) => tx.playlistTrack.update({
                where: { id: t.id },
                data: t.id === playlistTrackId
                    ? { position: idx, version: { increment: 1 } }
                    : { position: idx },
            })));
            return tx.playlistTrack.findMany({
                where: { playlistId },
                include: { track: true },
                orderBy: { position: 'asc' },
            });
        });
        this.events.emit('playlist.reordered', { playlistId, tracks: updated });
        return updated;
    }
};
exports.PlaylistsService = PlaylistsService;
exports.PlaylistsService = PlaylistsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PlaylistsService);
//# sourceMappingURL=playlists.service.js.map