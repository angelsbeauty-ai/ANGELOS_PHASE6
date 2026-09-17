"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const agent_controller_1 = require("./agent.controller");
const main_agent_service_1 = require("./main-agent.service");
const orchestrator_service_1 = require("./orchestrator/orchestrator.service");
const learning_rules_service_1 = require("./rules/learning-rules.service");
const bot_registry_service_1 = require("./bot/bot-registry.service");
const sub_agent_service_1 = require("./sub-agent/sub-agent.service");
const angels_beauty_bot_1 = require("./bot/angels-beauty.bot");
const academy_bot_1 = require("./bot/academy.bot");
const angelos_bot_1 = require("./bot/angelos.bot");
const general_bot_1 = require("./bot/general.bot");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        controllers: [agent_controller_1.AgentController, agent_controller_1.AgentHealthController],
        providers: [
            main_agent_service_1.MainAgentService,
            orchestrator_service_1.OrchestratorService,
            learning_rules_service_1.LearningRulesService,
            sub_agent_service_1.SubAgentService,
            angels_beauty_bot_1.AngelsBeautyBot,
            academy_bot_1.AcademyBot,
            angelos_bot_1.AngelOSBot,
            general_bot_1.GeneralBot,
            bot_registry_service_1.BotRegistry,
        ],
        exports: [
            main_agent_service_1.MainAgentService,
            orchestrator_service_1.OrchestratorService,
            learning_rules_service_1.LearningRulesService,
            bot_registry_service_1.BotRegistry,
            sub_agent_service_1.SubAgentService,
        ],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map