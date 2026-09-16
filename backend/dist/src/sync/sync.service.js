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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("../events/events.service");
const playlists_service_1 = require("../playlists/playlists.service");
let SyncService = class SyncService {
    constructor(eventsService, playlistsService) {
        this.eventsService = eventsService;
        this.playlistsService = playlistsService;
    }
    async snapshot(userId) {
        const [events, playlists] = await Promise.all([
            this.eventsService.listVisible(userId),
            this.playlistsService.listVisible(userId),
        ]);
        const [eventsDetailed, playlistsDetailed] = await Promise.all([
            Promise.all(events.map((e) => this.eventsService.getDetail(userId, e.id))),
            Promise.all(playlists.map((p) => this.playlistsService.getDetail(userId, p.id))),
        ]);
        return {
            serverTime: new Date().toISOString(),
            events: eventsDetailed,
            playlists: playlistsDetailed,
        };
    }
    async replay(userId, actions) {
        const results = [];
        for (const action of actions) {
            try {
                const result = await this.apply(userId, action);
                results.push({ id: action.id, status: 'applied', result });
            }
            catch (err) {
                if (err instanceof common_1.HttpException && err.getStatus() === 409) {
                    results.push({
                        id: action.id,
                        status: 'conflict',
                        error: err.getResponse(),
                    });
                }
                else if (err instanceof common_1.HttpException) {
                    results.push({
                        id: action.id,
                        status: 'error',
                        error: err.getResponse(),
                    });
                }
                else {
                    results.push({
                        id: action.id,
                        status: 'error',
                        error: 'Unknown error',
                    });
                }
            }
        }
        return results;
    }
    apply(userId, action) {
        const p = action.payload;
        switch (action.type) {
            case 'event.suggestTrack':
                return this.eventsService.suggestTrack(userId, p.eventId, p);
            case 'event.vote':
                return this.eventsService.vote(userId, p.eventId, p.eventTrackId, p);
            case 'event.unvote':
                return this.eventsService.unvote(userId, p.eventId, p.eventTrackId);
            case 'event.advance':
                return this.eventsService.advance(userId, p.eventId);
            case 'playlist.addTrack':
                return this.playlistsService.addTrack(userId, p.playlistId, p);
            case 'playlist.removeTrack':
                return this.playlistsService.removeTrack(userId, p.playlistId, p.playlistTrackId);
            case 'playlist.moveTrack':
                return this.playlistsService.moveTrack(userId, p.playlistId, p.playlistTrackId, p);
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        playlists_service_1.PlaylistsService])
], SyncService);
//# sourceMappingURL=sync.service.js.map