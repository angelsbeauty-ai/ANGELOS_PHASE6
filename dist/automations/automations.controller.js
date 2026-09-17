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
exports.AutomationsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const automations_service_1 = require("./automations.service");
const update_automation_rule_dto_1 = require("./dto/update-automation-rule.dto");
let AutomationsController = exports.AutomationsController = class AutomationsController {
    automations;
    constructor(automations) {
        this.automations = automations;
    }
    seed(user, workspaceId) { return this.automations.seedDefaults(user, workspaceId); }
    rules(user, workspaceId) { return this.automations.listRules(user, workspaceId); }
    updateRule(user, workspaceId, ruleId, dto) { return this.automations.updateRule(user, workspaceId, ruleId, dto); }
    jobs(user, workspaceId) { return this.automations.listJobs(user, workspaceId); }
    process(user, workspaceId, limit) { return this.automations.processDue(user, workspaceId, Number(limit ?? 20)); }
};
__decorate([
    (0, common_1.Post)('seed-defaults'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutomationsController.prototype, "seed", null);
__decorate([
    (0, common_1.Get)('rules'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutomationsController.prototype, "rules", null);
__decorate([
    (0, common_1.Patch)('rules/:ruleId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('ruleId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_automation_rule_dto_1.UpdateAutomationRuleDto]),
    __metadata("design:returntype", void 0)
], AutomationsController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutomationsController.prototype, "jobs", null);
__decorate([
    (0, common_1.Post)('process-due'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AutomationsController.prototype, "process", null);
exports.AutomationsController = AutomationsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/automations'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [automations_service_1.AutomationsService])
], AutomationsController);
//# sourceMappingURL=automations.controller.js.map