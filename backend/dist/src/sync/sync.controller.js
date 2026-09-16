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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const replay_actions_dto_1 = require("./dto/replay-actions.dto");
const sync_service_1 = require("./sync.service");
let SyncController = class SyncController {
    constructor(syncService) {
        this.syncService = syncService;
    }
    snapshot(user) {
        return this.syncService.snapshot(user.id);
    }
    replay(user, dto) {
        return this.syncService.replay(user.id, dto.actions);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Get)('snapshot'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Post)('replay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, replay_actions_dto_1.ReplayActionsDto]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "replay", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('sync (Offline mode bonus)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map