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
exports.PlaylistsGateway = void 0;
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const playlists_service_1 = require("./playlists.service");
let PlaylistsGateway = class PlaylistsGateway {
    constructor(jwt, config, playlistsService) {
        this.jwt = jwt;
        this.config = config;
        this.playlistsService = playlistsService;
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
    async join(client, playlistId) {
        const userId = client.data.userId;
        try {
            await this.playlistsService.getDetail(userId, playlistId);
            client.join(`playlist:${playlistId}`);
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message ?? 'Forbidden' };
        }
    }
    leave(client, playlistId) {
        client.leave(`playlist:${playlistId}`);
        return { ok: true };
    }
    onTrackAdded(payload) {
        this.server
            .to(`playlist:${payload.playlistId}`)
            .emit('track:added', payload.playlistTrack);
    }
    onTrackRemoved(payload) {
        this.server
            .to(`playlist:${payload.playlistId}`)
            .emit('track:removed', { playlistTrackId: payload.playlistTrackId });
    }
    onReordered(payload) {
        this.server
            .to(`playlist:${payload.playlistId}`)
            .emit('reordered', payload.tracks);
    }
};
exports.PlaylistsGateway = PlaylistsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PlaylistsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('playlist:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], PlaylistsGateway.prototype, "join", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('playlist:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], PlaylistsGateway.prototype, "leave", null);
__decorate([
    (0, event_emitter_1.OnEvent)('playlist.track.added'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaylistsGateway.prototype, "onTrackAdded", null);
__decorate([
    (0, event_emitter_1.OnEvent)('playlist.track.removed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaylistsGateway.prototype, "onTrackRemoved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('playlist.reordered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaylistsGateway.prototype, "onReordered", null);
exports.PlaylistsGateway = PlaylistsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/ws/playlists', cors: { origin: '*' } }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        playlists_service_1.PlaylistsService])
], PlaylistsGateway);
//# sourceMappingURL=playlists.gateway.js.map