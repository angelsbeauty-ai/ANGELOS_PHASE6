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
exports.CreateContentDraftDto = void 0;
const class_validator_1 = require("class-validator");
class CreateContentDraftDto {
    title;
    objective;
    goal;
    mediaAssetIds;
    platforms;
}
exports.CreateContentDraftDto = CreateContentDraftDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateContentDraftDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['reach', 'engagement', 'saves', 'profile_visits', 'inquiries', 'bookings', 'education', 'trust', 'availability']),
    __metadata("design:type", String)
], CreateContentDraftDto.prototype, "objective", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateContentDraftDto.prototype, "goal", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateContentDraftDto.prototype, "mediaAssetIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(4),
    (0, class_validator_1.IsIn)(['instagram', 'facebook', 'tiktok', 'manual'], { each: true }),
    __metadata("design:type", Array)
], CreateContentDraftDto.prototype, "platforms", void 0);
//# sourceMappingURL=create-content-draft.dto.js.map