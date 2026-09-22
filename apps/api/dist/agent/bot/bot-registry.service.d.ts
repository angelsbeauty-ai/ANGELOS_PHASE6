import { AngelsBeautyBot } from '../bot/angels-beauty.bot';
import { AcademyBot } from '../bot/academy.bot';
import { AngelOSBot } from '../bot/angelos.bot';
import { GeneralBot } from '../bot/general.bot';
import { SubAgentService } from '../sub-agent/sub-agent.service';
export type BotName = 'angels_beauty' | 'academy' | 'angelos' | 'general';
export declare class BotRegistry {
    private readonly angelsBeautyBot;
    private readonly academyBot;
    private readonly angelOSBot;
    private readonly generalBot;
    private readonly subAgentService;
    private bots;
    constructor(angelsBeautyBot: AngelsBeautyBot, academyBot: AcademyBot, angelOSBot: AngelOSBot, generalBot: GeneralBot, subAgentService: SubAgentService);
    get(botName: BotName): any;
    getAll(): Map<BotName, any>;
    executeTask(orchestratorTaskId: string, botName: BotName, subAgent: string, intent: string, description: string, requiresApproval: boolean, workspaceId: string): Promise<void>;
    getBotInfo(botName: BotName): {
        name: string;
        subAgent: string;
        capabilities: string[];
    } | null;
}
