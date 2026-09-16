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
exports.ReplayActionsDto = exports.OfflineAction = exports.SYNC_ACTION_TYPES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
exports.SYNC_ACTION_TYPES = [
    'event.suggestTrack',
    'event.vote',
    'event.unvote',
    'event.advance',
    'playlist.addTrack',
    'playlist.removeTrack',
    'playlist.moveTrack',
];
class OfflineAction {
}
exports.OfflineAction = OfflineAction;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client-generated id (e.g. local outbox row uuid), echoed back in the result',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OfflineAction.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.SYNC_ACTION_TYPES }),
    (0, class_validator_1.IsIn)(exports.SYNC_ACTION_TYPES),
    __metadata("design:type", String)
], OfflineAction.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Action-specific payload' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], OfflineAction.prototype, "payload", void 0);
class ReplayActionsDto {
}
exports.ReplayActionsDto = ReplayActionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OfflineAction] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OfflineAction),
    __metadata("design:type", Array)
], ReplayActionsDto.prototype, "actions", void 0);
//# sourceMappingURL=replay-actions.dto.js.map