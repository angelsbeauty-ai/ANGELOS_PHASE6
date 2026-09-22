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
exports.UpdateMediaAssetDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateMediaAssetDto {
    marketingPermission;
    marketingScope;
    contentStatus;
    lifecycleStatus;
}
exports.UpdateMediaAssetDto = UpdateMediaAssetDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unknown', 'private', 'treatment_only', 'marketing_approved', 'limited']),
    __metadata("design:type", String)
], UpdateMediaAssetDto.prototype, "marketingPermission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateMediaAssetDto.prototype, "marketingScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unused', 'reviewed', 'selected', 'ready', 'posted', 'archived']),
    __metadata("design:type", String)
], UpdateMediaAssetDto.prototype, "contentStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'archived']),
    __metadata("design:type", String)
], UpdateMediaAssetDto.prototype, "lifecycleStatus", void 0);
//# sourceMappingURL=update-media-asset.dto.js.map