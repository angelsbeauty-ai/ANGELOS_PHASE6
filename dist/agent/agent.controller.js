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
exports.AgentHealthController = exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const main_agent_service_1 = require("./main-agent.service");
const orchestrator_service_1 = require("./orchestrator/orchestrator.service");
const learning_rules_service_1 = require("./rules/learning-rules.service");
const bot_registry_service_1 = require("./bot/bot-registry.service");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let AgentController = class AgentController {
    mainAgent;
    orchestrator;
    learningRules;
    botRegistry;
    constructor(mainAgent, orchestrator, learningRules, botRegistry) {
        this.mainAgent = mainAgent;
        this.orchestrator = orchestrator;
        this.learningRules = learningRules;
        this.botRegistry = botRegistry;
    }
    async chat(user, workspaceId, body) {
        return this.mainAgent.handleRequest({
            workspaceId,
            userMessage: body.message,
            userContext: body.context,
        });
    }
    async listTasks(user, workspaceId, limit) {
        return this.orchestrator.listTasks(workspaceId, parseInt(limit ?? '50', 10));
    }
    async getTask(user, workspaceId, taskId) {
        return this.orchestrator.getTask(taskId);
    }
    async processTask(user, workspaceId, taskId) {
        const task = await this.orchestrator.getTask(taskId);
        if (!task.assigned_bot || task.status === 'queued' || task.status === 'awaiting_approval') {
            const assignment = await this.orchestrator.assignTask(taskId);
            task.assigned_bot = assignment.bot;
            task.assigned_sub_agent = assignment.subAgent;
            task.status = 'assigned';
        }
        if (!task.assigned_bot) {
            throw new Error('No bot assigned to this task');
        }
        await this.botRegistry.executeTask(taskId, task.assigned_bot, task.assigned_sub_agent || 'general', task.intent, task.user_message, task.requires_approval, workspaceId);
        return this.orchestrator.getTask(taskId);
    }
    async proposeRule(user, workspaceId, body) {
        return this.learningRules.proposeRule(workspaceId, body.ruleText, body.scope, body.scopeValue, 'user_correction');
    }
    async confirmRule(user, workspaceId, ruleId) {
        return this.learningRules.confirmRule(ruleId, user.id);
    }
    async rejectRule(user, workspaceId, ruleId) {
        return this.learningRules.rejectRule(ruleId);
    }
    async getRules(user, workspaceId, bot, scope, scopeValue) {
        if (bot)
            return this.learningRules.getRulesForBot(workspaceId, bot);
        if (scope && scopeValue)
            return this.learningRules.getRulesForScope(workspaceId, scope, scopeValue);
        return this.learningRules.getRules(workspaceId);
    }
    async listBots() {
        const bots = this.botRegistry.getAll();
        const result = [];
        for (const [name, bot] of bots.entries()) {
            result.push(bot.getBotInfo());
        }
        return result;
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/process'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "processTask", null);
__decorate([
    (0, common_1.Post)('rules/propose'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "proposeRule", null);
__decorate([
    (0, common_1.Post)('rules/:ruleId/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "confirmRule", null);
__decorate([
    (0, common_1.Post)('rules/:ruleId/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "rejectRule", null);
__decorate([
    (0, common_1.Get)('rules'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('bot')),
    __param(3, (0, common_1.Query)('scope')),
    __param(4, (0, common_1.Query)('scopeValue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getRules", null);
__decorate([
    (0, common_1.Get)('bots'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "listBots", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/agent'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [main_agent_service_1.MainAgentService,
        orchestrator_service_1.OrchestratorService,
        learning_rules_service_1.LearningRulesService,
        bot_registry_service_1.BotRegistry])
], AgentController);
let AgentHealthController = class AgentHealthController {
    health() {
        return { status: 'ok', component: 'main-agent', phase: 1 };
    }
};
exports.AgentHealthController = AgentHealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentHealthController.prototype, "health", null);
exports.AgentHealthController = AgentHealthController = __decorate([
    (0, common_1.Controller)('agent/health')
], AgentHealthController);
//# sourceMappingURL=agent.controller.js.map