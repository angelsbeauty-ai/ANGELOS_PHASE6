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
exports.HermesControlController = void 0;
const common_1 = require("@nestjs/common");
const hermes_task_service_1 = require("./hermes-task.service");
const hermes_control_service_1 = require("./hermes-control.service");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let HermesControlController = exports.HermesControlController = class HermesControlController {
    hermesTask;
    hermesControl;
    constructor(hermesTask, hermesControl) {
        this.hermesTask = hermesTask;
        this.hermesControl = hermesControl;
    }
    async createTask(user, workspaceId, body) {
        return this.hermesTask.create(user, body, workspaceId);
    }
    async listTasks(user, workspaceId, limit) {
        return this.hermesTask.listRecent(user, parseInt(limit ?? '50', 10));
    }
    async getTask(user, workspaceId, taskId) {
        return this.hermesTask.getOneForWorkspace(user, taskId, workspaceId);
    }
    async getTaskStatus(user, workspaceId, taskId) {
        return this.hermesTask.getCodexTaskStatus(user, taskId, workspaceId);
    }
    async approveTask(user, workspaceId, taskId) {
        return this.hermesTask.updateStatus(user, taskId, {
            approval_status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString()
        });
    }
    async recordResult(user, workspaceId, taskId, body) {
        return this.hermesTask.updateStatus(user, taskId, {
            status: body.error ? 'failed' : 'done',
            hermes_result: body.result,
            hermes_error: body.error,
            hermes_session_id: body.hermes_session_id,
            hermes_finished_at: new Date().toISOString()
        });
    }
    async getOverview(user, workspaceId) {
        return this.hermesControl.getOverviewAsSystem(workspaceId);
    }
};
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "getTask", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "getTaskStatus", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "approveTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/result'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "recordResult", null);
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HermesControlController.prototype, "getOverview", null);
exports.HermesControlController = HermesControlController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/hermes'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [hermes_task_service_1.HermesTaskService,
        hermes_control_service_1.HermesControlService])
], HermesControlController);
//# sourceMappingURL=hermes-control.controller.js.map