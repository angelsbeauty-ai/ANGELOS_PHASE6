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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_media_upload_dto_1 = require("./dto/create-media-upload.dto");
const update_media_asset_dto_1 = require("./dto/update-media-asset.dto");
const media_service_1 = require("./media.service");
let MediaController = exports.MediaController = class MediaController {
    media;
    constructor(media) {
        this.media = media;
    }
    list(user, workspaceId, clientId, contentStatus) {
        return this.media.list(user, workspaceId, { clientId, contentStatus });
    }
    createUpload(user, workspaceId, dto) {
        return this.media.createUpload(user, workspaceId, dto);
    }
    finalize(user, workspaceId, assetId) {
        return this.media.finalizeUpload(user, workspaceId, assetId);
    }
    viewUrl(user, workspaceId, assetId) {
        return this.media.createViewUrl(user, workspaceId, assetId);
    }
    exportUrl(user, workspaceId, assetId) {
        return this.media.createExportUrl(user, workspaceId, assetId);
    }
    update(user, workspaceId, assetId, dto) {
        return this.media.update(user, workspaceId, assetId, dto);
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('clientId')),
    __param(3, (0, common_1.Query)('contentStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('uploads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_media_upload_dto_1.CreateMediaUploadDto]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "createUpload", null);
__decorate([
    (0, common_1.Post)(':assetId/finalize'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "finalize", null);
__decorate([
    (0, common_1.Get)(':assetId/view-url'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "viewUrl", null);
__decorate([
    (0, common_1.Get)(':assetId/export-url'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "exportUrl", null);
__decorate([
    (0, common_1.Patch)(':assetId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('assetId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_media_asset_dto_1.UpdateMediaAssetDto]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "update", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/media'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map