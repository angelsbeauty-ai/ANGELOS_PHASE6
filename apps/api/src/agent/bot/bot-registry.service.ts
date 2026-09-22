import { Injectable } from '@nestjs/common';
import { AngelsBeautyBot } from '../bot/angels-beauty.bot';
import { AcademyBot } from '../bot/academy.bot';
import { AngelOSBot } from '../bot/angelos.bot';
import { GeneralBot } from '../bot/general.bot';
import { SubAgentService } from '../sub-agent/sub-agent.service';
import { createServiceSupabaseClient } from '../../config/supabase';

export type BotName = 'angels_beauty' | 'academy' | 'angelos' | 'general';

@Injectable()
export class BotRegistry {
  private bots: Map<BotName, any> = new Map();

  constructor(
    private readonly angelsBeautyBot: AngelsBeautyBot,
    private readonly academyBot: AcademyBot,
    private readonly angelOSBot: AngelOSBot,
    private readonly generalBot: GeneralBot,
    private readonly subAgentService: SubAgentService,
  ) {
    this.bots.set('angels_beauty', this.angelsBeautyBot);
    this.bots.set('academy', this.academyBot);
    this.bots.set('angelos', this.angelOSBot);
    this.bots.set('general', this.generalBot);
  }

  get(botName: BotName): any {
    return this.bots.get(botName);
  }

  getAll(): Map<BotName, any> {
    return this.bots;
  }

  async executeTask(
    orchestratorTaskId: string,
    botName: BotName,
    subAgent: string,
    intent: string,
    description: string,
    requiresApproval: boolean,
    workspaceId: string,
  ): Promise<void> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    const subTask = await this.subAgentService.createSubAgentTask(
      workspaceId,
      orchestratorTaskId,
      botName,
      subAgent,
      intent,
      description,
      requiresApproval,
    );

    const { success, result, confidence } = await bot.execute(
      subTask.id!,
      intent,
      description,
    );

    await this.subAgentService.updateSubAgentTaskStatus(subTask.id!, {
      status: success ? 'completed' : 'failed',
      result,
      confidence,
    });

    const supabase = createServiceSupabaseClient();
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

  getBotInfo(botName: BotName): { name: string; subAgent: string; capabilities: string[] } | null {
    const bot = this.bots.get(botName);
    if (!bot) return null;
    return bot.getBotInfo();
  }
}
