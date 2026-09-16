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
exports.ActionLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
let ActionLogInterceptor = class ActionLogInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const route = request.route?.path ?? request.url;
        if (method === 'GET' && route?.startsWith('/health')) {
            return next.handle();
        }
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => this.record(request, method, route, 'success'),
            error: () => this.record(request, method, route, 'error'),
        }));
    }
    record(request, method, route, outcome) {
        const user = request.user;
        const headers = request.headers ?? {};
        const rawPlatform = String(headers['x-client-platform'] ?? '').toUpperCase();
        const platform = ['ANDROID', 'IOS', 'WEB'].includes(rawPlatform)
            ? rawPlatform
            : 'UNKNOWN';
        const appVersion = String(headers['x-client-app-version'] ?? 'unknown');
        const deviceModel = String(headers['x-client-device'] ?? 'unknown');
        const installationId = headers['x-client-installation-id'];
        const run = async () => {
            let deviceId;
            if (user?.id && installationId) {
                const device = await this.prisma.device.findUnique({
                    where: {
                        userId_installationId: {
                            userId: user.id,
                            installationId: String(installationId),
                        },
                    },
                    select: { id: true },
                });
                deviceId = device?.id;
            }
            await this.prisma.actionLog.create({
                data: {
                    userId: user?.id,
                    deviceId,
                    platform,
                    appVersion,
                    action: `${method} ${route}`,
                    metadata: {
                        outcome,
                        deviceModel,
                        params: request.params,
                        query: request.query,
                    },
                },
            });
        };
        run().catch(() => { });
    }
};
exports.ActionLogInterceptor = ActionLogInterceptor;
exports.ActionLogInterceptor = ActionLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActionLogInterceptor);
//# sourceMappingURL=action-log.interceptor.js.map