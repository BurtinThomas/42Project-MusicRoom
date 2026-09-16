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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
const geo_1 = require("../common/utils/geo");
const delegations_service_1 = require("../delegations/delegations.service");
let EventsService = class EventsService {
    constructor(prisma, delegations, events) {
        this.prisma = prisma;
        this.delegations = delegations;
        this.events = events;
    }
    async create(ownerId, dto) {
        return this.prisma.event.create({
            data: {
                ownerId,
                name: dto.name,
                visibility: dto.visibility ?? client_1.Visibility.PUBLIC,
                voteLicense: dto.voteLicense ?? client_1.VoteLicense.OPEN,
                locationLat: dto.locationLat,
                locationLng: dto.locationLng,
                locationRadiusM: dto.locationRadiusM,
                voteWindowStart: dto.voteWindowStart
                    ? new Date(dto.voteWindowStart)
                    : undefined,
                voteWindowEnd: dto.voteWindowEnd
                    ? new Date(dto.voteWindowEnd)
                    : undefined,
            },
        });
    }
    async listVisible(userId) {
        return this.prisma.event.findMany({
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
    async getOrThrow(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async canView(event, userId) {
        if (event.visibility === client_1.Visibility.PUBLIC)
            return true;
        if (event.ownerId === userId)
            return true;
        const invite = await this.prisma.eventInvite.findUnique({
            where: { eventId_userId: { eventId: event.id, userId } },
        });
        return !!invite;
    }
    async getDetail(userId, eventId) {
        const event = await this.getOrThrow(eventId);
        const visible = await this.canView(event, userId);
        if (!visible)
            throw new common_1.ForbiddenException('This event is private');
        const tracks = await this.prisma.eventTrack.findMany({
            where: { eventId, playedAt: null },
            include: { track: true, _count: { select: { votes: true } } },
            orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        });
        const history = await this.prisma.eventTrack.findMany({
            where: { eventId, playedAt: { not: null } },
            include: { track: true },
            orderBy: { playedAt: 'desc' },
            take: 20,
        });
        return { event, queue: tracks, history };
    }
    async invite(ownerId, eventId, userId) {
        const event = await this.getOrThrow(eventId);
        if (event.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only the owner can invite users');
        return this.prisma.eventInvite.upsert({
            where: { eventId_userId: { eventId, userId } },
            create: { eventId, userId },
            update: {},
        });
    }
    async suggestTrack(userId, eventId, dto) {
        const event = await this.getOrThrow(eventId);
        const visible = await this.canView(event, userId);
        if (!visible)
            throw new common_1.ForbiddenException('This event is private');
        const track = await this.prisma.track.create({
            data: {
                title: dto.title,
                artist: dto.artist,
                durationMs: dto.durationMs,
                externalRef: dto.externalRef,
            },
        });
        const eventTrack = await this.prisma.eventTrack.create({
            data: { eventId, trackId: track.id, addedById: userId },
            include: { track: true },
        });
        this.events.emit('event.track.added', { eventId, eventTrack });
        return eventTrack;
    }
    async vote(userId, eventId, eventTrackId, dto) {
        const event = await this.getOrThrow(eventId);
        await this.assertCanVote(event, userId, dto);
        const eventTrack = await this.prisma.eventTrack.findFirst({
            where: { id: eventTrackId, eventId },
        });
        if (!eventTrack)
            throw new common_1.NotFoundException('Track not found in this event');
        if (eventTrack.playedAt)
            throw new common_1.BadRequestException('This track has already been played');
        try {
            const [, updated] = await this.prisma.$transaction([
                this.prisma.vote.create({ data: { eventTrackId, userId } }),
                this.prisma.eventTrack.update({
                    where: { id: eventTrackId },
                    data: { score: { increment: 1 } },
                    include: { track: true },
                }),
            ]);
            this.events.emit('event.vote.changed', { eventId, eventTrack: updated });
            return updated;
        }
        catch (err) {
            if (err?.code === 'P2002') {
                throw new common_1.ConflictException('You already voted for this track');
            }
            throw err;
        }
    }
    async unvote(userId, eventId, eventTrackId) {
        const vote = await this.prisma.vote.findUnique({
            where: { eventTrackId_userId: { eventTrackId, userId } },
        });
        if (!vote)
            throw new common_1.NotFoundException('You have not voted for this track');
        const [, updated] = await this.prisma.$transaction([
            this.prisma.vote.delete({ where: { id: vote.id } }),
            this.prisma.eventTrack.update({
                where: { id: eventTrackId },
                data: { score: { decrement: 1 } },
                include: { track: true },
            }),
        ]);
        this.events.emit('event.vote.changed', { eventId, eventTrack: updated });
        return updated;
    }
    async advance(userId, eventId) {
        const event = await this.getOrThrow(eventId);
        await this.assertCanControl(event, userId);
        const next = await this.prisma.eventTrack.findFirst({
            where: { eventId, playedAt: null },
            orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
            include: { track: true },
        });
        if (!next)
            throw new common_1.NotFoundException('Queue is empty');
        const updated = await this.prisma.eventTrack.update({
            where: { id: next.id },
            data: { playedAt: new Date() },
            include: { track: true },
        });
        this.events.emit('event.track.played', { eventId, eventTrack: updated });
        return updated;
    }
    async assertCanControl(event, userId) {
        if (event.ownerId === userId)
            return;
        const isDelegate = await this.delegations.isDelegateForOwner(event.ownerId, userId);
        if (!isDelegate)
            throw new common_1.ForbiddenException('You do not control playback for this event');
    }
    async assertCanVote(event, userId, dto) {
        const visible = await this.canView(event, userId);
        if (!visible)
            throw new common_1.ForbiddenException('This event is private');
        if (event.ownerId === userId)
            return;
        if (event.voteLicense === client_1.VoteLicense.OPEN)
            return;
        if (event.voteLicense === client_1.VoteLicense.INVITE_ONLY) {
            const invite = await this.prisma.eventInvite.findUnique({
                where: { eventId_userId: { eventId: event.id, userId } },
            });
            if (!invite)
                throw new common_1.ForbiddenException('Only invited users can vote on this event');
            return;
        }
        if (event.voteLicense === client_1.VoteLicense.LOCATION_TIME) {
            const now = new Date();
            if (event.voteWindowStart && now < event.voteWindowStart) {
                throw new common_1.ForbiddenException('Voting has not opened yet');
            }
            if (event.voteWindowEnd && now > event.voteWindowEnd) {
                throw new common_1.ForbiddenException('Voting has closed');
            }
            if (event.locationLat == null ||
                event.locationLng == null ||
                event.locationRadiusM == null) {
                return;
            }
            if (dto.lat == null || dto.lng == null) {
                throw new common_1.BadRequestException('Your location is required to vote on this event');
            }
            const distance = (0, geo_1.distanceMeters)(event.locationLat, event.locationLng, dto.lat, dto.lng);
            if (distance > event.locationRadiusM) {
                throw new common_1.ForbiddenException('You are too far from the event to vote');
            }
        }
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        delegations_service_1.DelegationsService,
        event_emitter_1.EventEmitter2])
], EventsService);
//# sourceMappingURL=events.service.js.map