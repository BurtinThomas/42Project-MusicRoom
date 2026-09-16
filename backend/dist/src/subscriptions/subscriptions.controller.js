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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const users_service_1 = require("../users/users.service");
class ChangePlanDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionPlan),
    __metadata("design:type", String)
], ChangePlanDto.prototype, "plan", void 0);
let SubscriptionsController = class SubscriptionsController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async me(user) {
        const full = await this.usersService.findById(user.id);
        return { plan: full?.subscriptionPlan };
    }
    async change(user, dto) {
        const updated = await this.usersService.setSubscriptionPlan(user.id, dto.plan);
        return { plan: updated.subscriptionPlan };
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ChangePlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "change", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('subscriptions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map