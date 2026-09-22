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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./approvals.service");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ApprovalsController = exports.ApprovalsController = class ApprovalsController {
    approvalsService;
    constructor(approvalsService) {
        this.approvalsService = approvalsService;
    }
    async createMessageApproval(user, body) {
        return this.approvalsService.createMessageApproval(user, {
            type: 'message',
            sourceId: body.sourceId,
            sourceChannel: body.sourceChannel,
            content: body.content,
            clientId: body.clientId,
            clientName: body.clientName,
            context: body.context,
            actionRequired: 'reply',
            workspaceId: body.workspaceId
        });
    }
    async createContentApproval(user, body) {
        return this.approvalsService.createContentApproval(user, {
            type: 'content',
            sourceId: body.sourceId,
            sourceChannel: body.sourceChannel,
            content: body.content,
            clientId: body.clientId || 'system',
            clientName: body.clientName,
            context: body.context,
            actionRequired: 'publish',
            workspaceId: body.workspaceId
        });
    }
    async createBookingApproval(user, body) {
        return this.approvalsService.createBookingApproval(user, {
            type: 'booking',
            sourceId: body.sourceId,
            sourceChannel: body.sourceChannel,
            content: body.content,
            clientId: body.clientId,
            clientName: body.clientName,
            context: body.context,
            actionRequired: 'confirm',
            workspaceId: body.workspaceId
        });
    }
    async submitDecision(user, body) {
        return this.approvalsService.submitApprovalDecision(user, {
            approvalId: body.approvalId,
            decision: body.decision,
            notes: body.notes,
            revisedContent: body.revisedContent
        }, body.workspaceId);
    }
    async getPendingApprovals(user, limit = '50', workspaceId) {
        return this.approvalsService.getPendingApprovals(user, parseInt(limit, 10), workspaceId);
    }
    executeMessage(user, id, body) {
        return this.approvalsService.executeMessageApproval(user, id, body.workspaceId);
    }
    async getHistory(user, clientId, type, limit = '100', workspaceId) {
        return this.approvalsService.getApprovalHistory(user, clientId, type, parseInt(limit, 10), workspaceId);
    }
    async getApprovalById(user, id, workspaceId) {
        return this.approvalsService.getApprovalById(user, id, workspaceId);
    }
};
__decorate([
    (0, common_1.Post)('message'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "createMessageApproval", null);
__decorate([
    (0, common_1.Post)('content'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "createContentApproval", null);
__decorate([
    (0, common_1.Post)('booking'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "createBookingApproval", null);
__decorate([
    (0, common_1.Post)('decide'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "submitDecision", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "executeMessage", null);
__decorate([
    (0, common_1.Get)('history/list'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('clientId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, String]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getApprovalById", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map