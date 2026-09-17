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
exports.SystemHealthController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const update_operational_controls_dto_1 = require("./dto/update-operational-controls.dto");
const system_health_service_1 = require("./system-health.service");
let SystemHealthController = class SystemHealthController {
    health;
    constructor(health) {
        this.health = health;
    }
    overview(user, workspaceId) {
        return this.health.getOverview(user, workspaceId);
    }
    run(user, workspaceId) {
        return this.health.runHealthCheck(user, workspaceId);
    }
    attention(user, workspaceId) {
        return this.health.listAttention(user, workspaceId);
    }
    acknowledge(user, workspaceId, attentionId) {
        return this.health.acknowledgeAttention(user, workspaceId, attentionId);
    }
    controls(user, workspaceId, dto) {
        return this.health.updateControls(user, workspaceId, dto);
    }
};
exports.SystemHealthController = SystemHealthController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SystemHealthController.prototype, "overview", null);
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SystemHealthController.prototype, "run", null);
__decorate([
    (0, common_1.Get)('attention'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SystemHealthController.prototype, "attention", null);
__decorate([
    (0, common_1.Post)('attention/:attentionId/acknowledge'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('attentionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SystemHealthController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Patch)('controls'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_operational_controls_dto_1.UpdateOperationalControlsDto]),
    __metadata("design:returntype", void 0)
], SystemHealthController.prototype, "controls", null);
exports.SystemHealthController = SystemHealthController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/system-health'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [system_health_service_1.SystemHealthService])
], SystemHealthController);
//# sourceMappingURL=system-health.controller.js.map