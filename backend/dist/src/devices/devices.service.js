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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let DevicesService = class DevicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    register(userId, dto) {
        return this.prisma.device.upsert({
            where: {
                userId_installationId: { userId, installationId: dto.installationId },
            },
            create: {
                userId,
                installationId: dto.installationId,
                platform: dto.platform,
                model: dto.model,
                appVersion: dto.appVersion,
            },
            update: {
                platform: dto.platform,
                model: dto.model,
                appVersion: dto.appVersion,
            },
        });
    }
    listForUser(userId) {
        return this.prisma.device.findMany({
            where: { userId },
            orderBy: { lastSeenAt: 'desc' },
        });
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map