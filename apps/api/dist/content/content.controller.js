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
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const content_service_1 = require("./content.service");
const create_content_draft_dto_1 = require("./dto/create-content-draft.dto");
const review_content_media_dto_1 = require("./dto/review-content-media.dto");
const schedule_content_variant_dto_1 = require("./dto/schedule-content-variant.dto");
const update_content_variant_dto_1 = require("./dto/update-content-variant.dto");
let ContentController = exports.ContentController = class ContentController {
    content;
    constructor(content) {
        this.content = content;
    }
    list(user, workspaceId) {
        return this.content.list(user, workspaceId);
    }
    get(user, workspaceId, contentPostId) {
        return this.content.get(user, workspaceId, contentPostId);
    }
    reviewMedia(user, workspaceId, dto) {
        return this.content.reviewMedia(user, workspaceId, dto);
    }
    createDraft(user, workspaceId, dto) {
        return this.content.createDraft(user, workspaceId, dto);
    }
    approve(user, workspaceId, contentPostId) {
        return this.content.approve(user, workspaceId, contentPostId);
    }
    updateVariant(user, workspaceId, variantId, dto) {
        return this.content.updateVariant(user, workspaceId, variantId, dto);
    }
    scheduleVariant(user, workspaceId, variantId, dto) {
        return this.content.scheduleVariant(user, workspaceId, variantId, dto.scheduledFor);
    }
    publishNow(user, workspaceId, variantId) {
        return this.content.publishNow(user, workspaceId, variantId);
    }
    publishStatus(user, workspaceId) {
        return this.content.getPublishStatus(user, workspaceId);
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':contentPostId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('contentPostId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('review-media'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, review_content_media_dto_1.ReviewContentMediaDto]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "reviewMedia", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_content_draft_dto_1.CreateContentDraftDto]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Post)(':contentPostId/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('contentPostId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('variants/:variantId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('variantId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_content_variant_dto_1.UpdateContentVariantDto]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "updateVariant", null);
__decorate([
    (0, common_1.Post)('variants/:variantId/schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('variantId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, schedule_content_variant_dto_1.ScheduleContentVariantDto]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "scheduleVariant", null);
__decorate([
    (0, common_1.Post)('variants/:variantId/publish'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('variantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "publishNow", null);
__decorate([
    (0, common_1.Get)('publish-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "publishStatus", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/content'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
//# sourceMappingURL=content.controller.js.map