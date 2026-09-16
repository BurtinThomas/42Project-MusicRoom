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
exports.MovePlaylistTrackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class MovePlaylistTrackDto {
}
exports.MovePlaylistTrackDto = MovePlaylistTrackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New position (0-based)' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MovePlaylistTrackDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The version of the track as last read by the client. Used for optimistic ' +
            'concurrency: if the track was modified concurrently, the request is rejected ' +
            'with 409 Conflict and the current state, instead of silently overwriting it.',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], MovePlaylistTrackDto.prototype, "expectedVersion", void 0);
//# sourceMappingURL=move-track.dto.js.map