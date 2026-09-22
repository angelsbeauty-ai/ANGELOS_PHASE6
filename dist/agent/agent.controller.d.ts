import { MainAgentService, MainAgentResponse } from './main-agent.service';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { LearningRulesService } from './rules/learning-rules.service';
import { BotRegistry } from './bot/bot-registry.service';
import { AuthUser } from '../auth/auth-user';
export declare class AgentController {
    private readonly mainAgent;
    private readonly orchestrator;
    private readonly learningRules;
    private readonly botRegistry;
    constructor(mainAgent: MainAgentService, orchestrator: OrchestratorService, learningRules: LearningRulesService, botRegistry: BotRegistry);
    chat(user: AuthUser, workspaceId: string, body: {
        message: string;
        context?: Record<string, any>;
    }): Promise<MainAgentResponse>;
    listTasks(user: AuthUser, workspaceId: string, limit?: string): Promise<import("./orchestrator/orchestrator.service").OrchestratorTask[]>;
    getTask(user: AuthUser, workspaceId: string, taskId: string): Promise<import("./orchestrator/orchestrator.service").OrchestratorTask>;
    processTask(user: AuthUser, workspaceId: string, taskId: string): Promise<import("./orchestrator/orchestrator.service").OrchestratorTask>;
    proposeRule(user: AuthUser, workspaceId: string, body: {
        ruleText: string;
        scope: string;
        scopeValue?: string;
    }): Promise<import("./rules/learning-rules.service").LearningRule>;
    confirmRule(user: AuthUser, workspaceId: string, ruleId: string): Promise<import("./rules/learning-rules.service").LearningRule>;
    rejectRule(user: AuthUser, workspaceId: string, ruleId: string): Promise<void>;
    getRules(user: AuthUser, workspaceId: string, bot?: string, scope?: string, scopeValue?: string): Promise<import("./rules/learning-rules.service").LearningRule[]>;
    listBots(): Promise<any[]>;
}
export declare class AgentHealthController {
    health(): {
        status: string;
        component: string;
        phase: number;
    };
}
