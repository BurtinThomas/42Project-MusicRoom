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
exports.DelegationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let DelegationsService = class DelegationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async grant(ownerId, dto) {
        const device = await this.prisma.device.findFirst({
            where: { id: dto.deviceId, userId: ownerId },
        });
        if (!device)
            throw new common_1.NotFoundException('Device not found on your account');
        if (dto.delegateId === ownerId) {
            throw new common_1.ForbiddenException('You already control your own device');
        }
        await this.prisma.controlDelegation.updateMany({
            where: { deviceId: dto.deviceId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return this.prisma.controlDelegation.create({
            data: { ownerId, deviceId: dto.deviceId, delegateId: dto.delegateId },
        });
    }
    async revoke(ownerId, delegationId) {
        const delegation = await this.prisma.controlDelegation.findFirst({
            where: { id: delegationId, ownerId },
        });
        if (!delegation)
            throw new common_1.NotFoundException('Delegation not found');
        return this.prisma.controlDelegation.update({
            where: { id: delegationId },
            data: { revokedAt: new Date() },
        });
    }
    listForOwner(ownerId) {
        return this.prisma.controlDelegation.findMany({
            where: { ownerId },
            include: {
                device: true,
                delegate: { select: { id: true, displayName: true } },
            },
            orderBy: { grantedAt: 'desc' },
        });
    }
    listReceivedBy(delegateId) {
        return this.prisma.controlDelegation.findMany({
            where: { delegateId, revokedAt: null },
            include: {
                device: true,
                owner: { select: { id: true, displayName: true } },
            },
        });
    }
    async isDelegateForOwner(ownerId, candidateId) {
        const delegation = await this.prisma.controlDelegation.findFirst({
            where: { ownerId, delegateId: candidateId, revokedAt: null },
        });
        return !!delegation;
    }
};
exports.DelegationsService = DelegationsService;
exports.DelegationsService = DelegationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DelegationsService);
//# sourceMappingURL=delegations.service.js.map