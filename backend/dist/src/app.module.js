"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = require("./config/configuration");
const prisma_module_1 = require("./common/prisma/prisma.module");
const action_log_interceptor_1 = require("./common/logging/action-log.interceptor");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const users_module_1 = require("./users/users.module");
const friendships_module_1 = require("./friendships/friendships.module");
const devices_module_1 = require("./devices/devices.module");
const events_module_1 = require("./events/events.module");
const playlists_module_1 = require("./playlists/playlists.module");
const delegations_module_1 = require("./delegations/delegations.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const beacons_module_1 = require("./beacons/beacons.module");
const sync_module_1 = require("./sync/sync.module");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            event_emitter_1.EventEmitterModule.forRoot(),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => [
                    {
                        ttl: config.get('throttler.ttlMs'),
                        limit: config.get('throttler.globalLimit'),
                    },
                ],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            friendships_module_1.FriendshipsModule,
            devices_module_1.DevicesModule,
            events_module_1.EventsModule,
            playlists_module_1.PlaylistsModule,
            delegations_module_1.DelegationsModule,
            subscriptions_module_1.SubscriptionsModule,
            beacons_module_1.BeaconsModule,
            sync_module_1.SyncModule,
            health_module_1.HealthModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: action_log_interceptor_1.ActionLogInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map