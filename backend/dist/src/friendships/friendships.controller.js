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
exports.FriendshipsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const friendships_service_1 = require("./friendships.service");
class RequestFriendshipDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestFriendshipDto.prototype, "addresseeId", void 0);
class RespondFriendshipDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RespondFriendshipDto.prototype, "accept", void 0);
let FriendshipsController = class FriendshipsController {
    constructor(friendships) {
        this.friendships = friendships;
    }
    list(user) {
        return this.friendships.listFor(user.id);
    }
    request(user, dto) {
        return this.friendships.request(user.id, dto.addresseeId);
    }
    respond(user, id, dto) {
        return this.friendships.respond(user.id, id, dto.accept);
    }
};
exports.FriendshipsController = FriendshipsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendshipsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RequestFriendshipDto]),
    __metadata("design:returntype", void 0)
], FriendshipsController.prototype, "request", null);
__decorate([
    (0, common_1.Post)(':id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, RespondFriendshipDto]),
    __metadata("design:returntype", void 0)
], FriendshipsController.prototype, "respond", null);
exports.FriendshipsController = FriendshipsController = __decorate([
    (0, swagger_1.ApiTags)('friendships'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('friendships'),
    __metadata("design:paramtypes", [friendships_service_1.FriendshipsService])
], FriendshipsController);
//# sourceMappingURL=friendships.controller.js.map