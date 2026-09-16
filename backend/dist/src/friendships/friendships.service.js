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
exports.FriendshipsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
let FriendshipsService = class FriendshipsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async areFriends(userIdA, userIdB) {
        if (userIdA === userIdB)
            return true;
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                status: client_1.FriendshipStatus.ACCEPTED,
                OR: [
                    { requesterId: userIdA, addresseeId: userIdB },
                    { requesterId: userIdB, addresseeId: userIdA },
                ],
            },
        });
        return !!friendship;
    }
    async request(requesterId, addresseeId) {
        if (requesterId === addresseeId) {
            throw new common_1.BadRequestException('You cannot friend yourself');
        }
        const existing = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });
        if (existing)
            throw new common_1.ConflictException('A friendship request already exists');
        return this.prisma.friendship.create({
            data: { requesterId, addresseeId },
        });
    }
    async respond(userId, friendshipId, accept) {
        const friendship = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
        if (!friendship || friendship.addresseeId !== userId) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        if (!accept) {
            return this.prisma.friendship.delete({ where: { id: friendshipId } });
        }
        return this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: client_1.FriendshipStatus.ACCEPTED },
        });
    }
    listFor(userId) {
        return this.prisma.friendship.findMany({
            where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
            include: { requester: true, addressee: true },
        });
    }
};
exports.FriendshipsService = FriendshipsService;
exports.FriendshipsService = FriendshipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FriendshipsService);
//# sourceMappingURL=friendships.service.js.map