import { Injectable } from '@nestjs/common';
import { createServiceSupabaseClient } from '../../config/supabase';

/**
 * General Bot — handles general requests, reports, and marketing.
 * Domain: marketing, content, analytics, reports, general tasks.
 */
@Injectable()
export class GeneralBot {
  private readonly botName = 'general';
  private readonly subAgent = 'general';

  async execute(taskId: string, intent: string, description: string): Promise<{ success: boolean; result: any; confidence: number }> {
    const supabase = createServiceSupabaseClient();

    console.log(`[${this.botName}] Executing task ${taskId}: ${intent} — ${description}`);

    const result = {
      bot: this.botName,
      subAgent: this.subAgent,
      taskId,
      intent,
      description,
      summary: `General bot processed: ${description}`,
      actionTaken: 'no_action_phase1',
      dataReviewed: [],
      recommendation: 'Ready for your review',
    };

    return { success: true, result, confidence: 90 };
  }

  getBotInfo(): { name: string; subAgent: string; capabilities: string[] } {
    return {
      name: this.botName,
      subAgent: this.subAgent,
      capabilities: [
        'Marketing research and content',
        'Analytics and reporting',
        'General task processing',
        'Social media research',
        'Audience analysis',
      ],
    };
  }
}
