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
exports.CreateMediaUploadDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMediaUploadDto {
    filename;
    mimeType;
    sizeBytes;
    width;
    height;
    durationMs;
    source;
    capturedAt;
    clientId;
    appointmentId;
    treatmentRecordId;
    role;
    marketingPermission;
    marketingScope;
}
exports.CreateMediaUploadDto = CreateMediaUploadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "filename", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(262144000),
    __metadata("design:type", Number)
], CreateMediaUploadDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50000),
    __metadata("design:type", Number)
], CreateMediaUploadDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50000),
    __metadata("design:type", Number)
], CreateMediaUploadDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(86400000),
    __metadata("design:type", Number)
], CreateMediaUploadDto.prototype, "durationMs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['phone_photos', 'camera', 'phone_files', 'import', 'generated', 'other']),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "capturedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "appointmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "treatmentRecordId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['before', 'after', 'healed', 'touch_up', 'client_submitted', 'consultation', 'content_source', 'document', 'other']),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unknown', 'private', 'treatment_only', 'marketing_approved', 'limited']),
    __metadata("design:type", String)
], CreateMediaUploadDto.prototype, "marketingPermission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMediaUploadDto.prototype, "marketingScope", void 0);
//# sourceMappingURL=create-media-upload.dto.js.map