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
exports.PlaylistsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const add_track_dto_1 = require("./dto/add-track.dto");
const create_playlist_dto_1 = require("./dto/create-playlist.dto");
const invite_user_dto_1 = require("../events/dto/invite-user.dto");
const move_track_dto_1 = require("./dto/move-track.dto");
const playlists_service_1 = require("./playlists.service");
let PlaylistsController = class PlaylistsController {
    constructor(playlistsService) {
        this.playlistsService = playlistsService;
    }
    list(user) {
        return this.playlistsService.listVisible(user.id);
    }
    create(user, dto) {
        return this.playlistsService.create(user.id, dto);
    }
    getDetail(user, id) {
        return this.playlistsService.getDetail(user.id, id);
    }
    invite(user, id, dto) {
        return this.playlistsService.invite(user.id, id, dto.userId);
    }
    addTrack(user, id, dto) {
        return this.playlistsService.addTrack(user.id, id, dto);
    }
    removeTrack(user, id, trackId) {
        return this.playlistsService.removeTrack(user.id, id, trackId);
    }
    moveTrack(user, id, trackId, dto) {
        return this.playlistsService.moveTrack(user.id, id, trackId, dto);
    }
};
exports.PlaylistsController = PlaylistsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_playlist_dto_1.CreatePlaylistDto]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Post)(':id/invites'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, invite_user_dto_1.InviteUserDto]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(':id/tracks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_track_dto_1.AddPlaylistTrackDto]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "addTrack", null);
__decorate([
    (0, common_1.Delete)(':id/tracks/:trackId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('trackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "removeTrack", null);
__decorate([
    (0, common_1.Put)(':id/tracks/:trackId/position'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('trackId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, move_track_dto_1.MovePlaylistTrackDto]),
    __metadata("design:returntype", void 0)
], PlaylistsController.prototype, "moveTrack", null);
exports.PlaylistsController = PlaylistsController = __decorate([
    (0, swagger_1.ApiTags)('playlists (Music Playlist Editor)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('playlists'),
    __metadata("design:paramtypes", [playlists_service_1.PlaylistsService])
], PlaylistsController);
//# sourceMappingURL=playlists.controller.js.map