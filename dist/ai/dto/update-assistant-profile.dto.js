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
exports.UpdateAssistantProfileDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateAssistantProfileDto {
    displayName;
    avatarKey;
    personalityPrompt;
    primaryLanguage;
    tone;
    responseLength;
    proactivity;
    floatingButtonMode;
    guidanceQuestionsEnabled;
    explainRecommendations;
}
exports.UpdateAssistantProfileDto = UpdateAssistantProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 60),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", Object)
], UpdateAssistantProfileDto.prototype, "avatarKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1200),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "personalityPrompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "primaryLanguage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['warm_professional', 'direct', 'calm', 'friendly', 'custom']),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "tone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['concise', 'balanced', 'detailed']),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "responseLength", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'balanced', 'high']),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "proactivity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['on', 'compact', 'off']),
    __metadata("design:type", String)
], UpdateAssistantProfileDto.prototype, "floatingButtonMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAssistantProfileDto.prototype, "guidanceQuestionsEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAssistantProfileDto.prototype, "explainRecommendations", void 0);
//# sourceMappingURL=update-assistant-profile.dto.js.map