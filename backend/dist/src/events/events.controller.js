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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const create_event_dto_1 = require("./dto/create-event.dto");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const suggest_track_dto_1 = require("./dto/suggest-track.dto");
const vote_dto_1 = require("./dto/vote.dto");
const events_service_1 = require("./events.service");
let EventsController = class EventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    list(user) {
        return this.eventsService.listVisible(user.id);
    }
    create(user, dto) {
        return this.eventsService.create(user.id, dto);
    }
    getDetail(user, id) {
        return this.eventsService.getDetail(user.id, id);
    }
    invite(user, id, dto) {
        return this.eventsService.invite(user.id, id, dto.userId);
    }
    suggestTrack(user, id, dto) {
        return this.eventsService.suggestTrack(user.id, id, dto);
    }
    vote(user, id, eventTrackId, dto) {
        return this.eventsService.vote(user.id, id, eventTrackId, dto);
    }
    unvote(user, id, eventTrackId) {
        return this.eventsService.unvote(user.id, id, eventTrackId);
    }
    advance(user, id) {
        return this.eventsService.advance(user.id, id);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Post)(':id/invites'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, invite_user_dto_1.InviteUserDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(':id/tracks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, suggest_track_dto_1.SuggestTrackDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "suggestTrack", null);
__decorate([
    (0, common_1.Post)(':id/tracks/:eventTrackId/vote'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('eventTrackId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, vote_dto_1.VoteDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "vote", null);
__decorate([
    (0, common_1.Delete)(':id/tracks/:eventTrackId/vote'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('eventTrackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "unvote", null);
__decorate([
    (0, common_1.Post)(':id/advance'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "advance", null);
exports.EventsController = EventsController = __decorate([
    (0, swagger_1.ApiTags)('events (Music Track Vote)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map