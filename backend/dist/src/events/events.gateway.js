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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const events_service_1 = require("./events.service");
let EventsGateway = class EventsGateway {
    constructor(jwt, config, eventsService) {
        this.jwt = jwt;
        this.config = config;
        this.eventsService = eventsService;
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.query?.token;
        if (!token) {
            client.disconnect(true);
            return;
        }
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            client.data.userId = payload.sub;
        }
        catch {
            client.disconnect(true);
        }
    }
    async join(client, eventId) {
        const userId = client.data.userId;
        try {
            await this.eventsService.getDetail(userId, eventId);
            client.join(`event:${eventId}`);
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message ?? 'Forbidden' };
        }
    }
    leave(client, eventId) {
        client.leave(`event:${eventId}`);
        return { ok: true };
    }
    onTrackAdded(payload) {
        this.server
            .to(`event:${payload.eventId}`)
            .emit('track:added', payload.eventTrack);
    }
    onVoteChanged(payload) {
        this.server
            .to(`event:${payload.eventId}`)
            .emit('vote:changed', payload.eventTrack);
    }
    onTrackPlayed(payload) {
        this.server
            .to(`event:${payload.eventId}`)
            .emit('track:played', payload.eventTrack);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('event:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "join", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('event:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "leave", null);
__decorate([
    (0, event_emitter_1.OnEvent)('event.track.added'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onTrackAdded", null);
__decorate([
    (0, event_emitter_1.OnEvent)('event.vote.changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onVoteChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)('event.track.played'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onTrackPlayed", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/ws/events', cors: { origin: '*' } }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        events_service_1.EventsService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map