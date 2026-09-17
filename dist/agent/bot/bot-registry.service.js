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
exports.BotRegistry = void 0;
const common_1 = require("@nestjs/common");
const angels_beauty_bot_1 = require("../bot/angels-beauty.bot");
const academy_bot_1 = require("../bot/academy.bot");
const angelos_bot_1 = require("../bot/angelos.bot");
const general_bot_1 = require("../bot/general.bot");
const sub_agent_service_1 = require("../sub-agent/sub-agent.service");
const supabase_1 = require("../../config/supabase");
let BotRegistry = class BotRegistry {
    angelsBeautyBot;
    academyBot;
    angelOSBot;
    generalBot;
    subAgentService;
    bots = new Map();
    constructor(angelsBeautyBot, academyBot, angelOSBot, generalBot, subAgentService) {
        this.angelsBeautyBot = angelsBeautyBot;
        this.academyBot = academyBot;
        this.angelOSBot = angelOSBot;
        this.generalBot = generalBot;
        this.subAgentService = subAgentService;
        this.bots.set('angels_beauty', this.angelsBeautyBot);
        this.bots.set('academy', this.academyBot);
        this.bots.set('angelos', this.angelOSBot);
        this.bots.set('general', this.generalBot);
    }
    get(botName) {
        return this.bots.get(botName);
    }
    getAll() {
        return this.bots;
    }
    async executeTask(orchestratorTaskId, botName, subAgent, intent, description, requiresApproval, workspaceId) {
        const bot = this.bots.get(botName);
        if (!bot) {
            throw new Error(`Bot ${botName} not found`);
        }
        const subTask = await this.subAgentService.createSubAgentTask(workspaceId, orchestratorTaskId, botName, subAgent, intent, description, requiresApproval);
        const { success, result, confidence } = await bot.execute(subTask.id, intent, description);
        await this.subAgentService.updateSubAgentTaskStatus(subTask.id, {
            status: success ? 'completed' : 'failed',
            result,
            confidence,
        });
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        await supabase
            .from('agent_orchestrator_tasks')
            .update({
            status: success ? 'completed' : 'failed',
            result,
            confidence,
            updated_at: new Date().toISOString(),
        })
            .eq('id', orchestratorTaskId);
    }
    getBotInfo(botName) {
        const bot = this.bots.get(botName);
        if (!bot)
            return null;
        return bot.getBotInfo();
    }
};
exports.BotRegistry = BotRegistry;
exports.BotRegistry = BotRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [angels_beauty_bot_1.AngelsBeautyBot,
        academy_bot_1.AcademyBot,
        angelos_bot_1.AngelOSBot,
        general_bot_1.GeneralBot,
        sub_agent_service_1.SubAgentService])
], BotRegistry);
//# sourceMappingURL=bot-registry.service.js.map