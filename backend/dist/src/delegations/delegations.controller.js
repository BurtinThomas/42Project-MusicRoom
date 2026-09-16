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
exports.DelegationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const delegations_service_1 = require("./delegations.service");
const grant_delegation_dto_1 = require("./dto/grant-delegation.dto");
let DelegationsController = class DelegationsController {
    constructor(delegationsService) {
        this.delegationsService = delegationsService;
    }
    listGranted(user) {
        return this.delegationsService.listForOwner(user.id);
    }
    listReceived(user) {
        return this.delegationsService.listReceivedBy(user.id);
    }
    grant(user, dto) {
        return this.delegationsService.grant(user.id, dto);
    }
    revoke(user, id) {
        return this.delegationsService.revoke(user.id, id);
    }
};
exports.DelegationsController = DelegationsController;
__decorate([
    (0, common_1.Get)('granted'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DelegationsController.prototype, "listGranted", null);
__decorate([
    (0, common_1.Get)('received'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DelegationsController.prototype, "listReceived", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, grant_delegation_dto_1.GrantDelegationDto]),
    __metadata("design:returntype", void 0)
], DelegationsController.prototype, "grant", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DelegationsController.prototype, "revoke", null);
exports.DelegationsController = DelegationsController = __decorate([
    (0, swagger_1.ApiTags)('delegations (Music Control Delegation)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('delegations'),
    __metadata("design:paramtypes", [delegations_service_1.DelegationsService])
], DelegationsController);
//# sourceMappingURL=delegations.controller.js.map