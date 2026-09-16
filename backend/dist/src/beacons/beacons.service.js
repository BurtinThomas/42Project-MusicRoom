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
exports.BeaconsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
let BeaconsService = class BeaconsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async setForEvent(ownerId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only the owner can set a beacon');
        return this.prisma.eventBeacon.upsert({
            where: { eventId },
            create: { eventId, uuid: dto.uuid, major: dto.major, minor: dto.minor },
            update: { uuid: dto.uuid, major: dto.major, minor: dto.minor },
        });
    }
    async scan(uuid, major, minor) {
        const beacon = await this.prisma.eventBeacon.findUnique({
            where: { uuid_major_minor: { uuid, major, minor } },
            include: {
                event: {
                    include: {
                        tracks: {
                            where: { playedAt: null },
                            orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
                            take: 1,
                            include: { track: true },
                        },
                    },
                },
            },
        });
        if (!beacon)
            throw new common_1.NotFoundException('No event registered for this beacon');
        if (beacon.event.visibility !== client_1.Visibility.PUBLIC) {
            throw new common_1.NotFoundException('No event registered for this beacon');
        }
        return {
            eventId: beacon.event.id,
            name: beacon.event.name,
            currentTopTrack: beacon.event.tracks[0]?.track ?? null,
        };
    }
};
exports.BeaconsService = BeaconsService;
exports.BeaconsService = BeaconsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BeaconsService);
//# sourceMappingURL=beacons.service.js.map