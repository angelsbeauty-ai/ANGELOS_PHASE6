import { Module } from '@nestjs/common';
import { AgentController, AgentHealthController } from './agent.controller';
import { MainAgentService } from './main-agent.service';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { LearningRulesService } from './rules/learning-rules.service';
import { BotRegistry } from './bot/bot-registry.service';
import { SubAgentService } from './sub-agent/sub-agent.service';
import { AngelsBeautyBot } from './bot/angels-beauty.bot';
import { AcademyBot } from './bot/academy.bot';
import { AngelOSBot } from './bot/angelos.bot';
import { GeneralBot } from './bot/general.bot';

@Module({
  controllers: [AgentController, AgentHealthController],
  providers: [
    MainAgentService,
    OrchestratorService,
    LearningRulesService,
    SubAgentService,
    AngelsBeautyBot,
    AcademyBot,
    AngelOSBot,
    GeneralBot,
    BotRegistry,
  ],
  exports: [
    MainAgentService,
    OrchestratorService,
    LearningRulesService,
    BotRegistry,
    SubAgentService,
  ],
})
export class AgentModule {}
