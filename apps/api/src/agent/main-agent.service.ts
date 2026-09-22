import { Injectable, BadRequestException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

export interface MainAgentRequest {
  workspaceId: string;
  userMessage: string;
  userContext?: Record<string, any>;
}

export interface MainAgentResponse {
  answer: string;
  confidence: number;
  status: 'done' | 'needs_review' | 'blocked';
  requiresApproval: boolean;
  approvalReason?: string;
  tasksCreated: number;
  evidence?: any[];
}

@Injectable()
export class MainAgentService {
  async handleRequest(request: MainAgentRequest): Promise<MainAgentResponse> {
    const message = request.userMessage.trim();
    if (!message) {
      throw new BadRequestException('Message is required');
    }

    const intent = this.classifyIntent(message);
    const requiresApproval = this.requiresApprovalCheck(message, intent);
    const task = await this.createOrchestratorTask(request.workspaceId, message, intent, requiresApproval);

    const answer = this.formulateAnswer(message, intent, task, requiresApproval);
    const confidence = requiresApproval ? 50 : 90;

    return {
      answer,
      confidence,
      status: requiresApproval ? 'needs_review' : 'done',
      requiresApproval,
      approvalReason: requiresApproval ? this.getApprovalReason(intent) : undefined,
      tasksCreated: 1,
      evidence: [{ taskId: task.id, intent }],
    };
  }

  private classifyIntent(message: string): string {
    const lower = message.toLowerCase();
    if (/build|code|fix|develop|program|implement|create (app|feature|page|component)/i.test(lower)) return 'build';
    if (/marketing|post|content|social|audience|growth|campaign|publish/i.test(lower)) return 'marketing';
    if (/client|customer|inquiry|lead|booking|appointment|schedule|follow.up/i.test(lower)) return 'crm';
    if (/report|status|overview|summary|analytics|metrics|performance/i.test(lower)) return 'report';
    if (/approve|confirm|execute|send|publish|deploy|push|merge/i.test(lower)) return 'action';
    if (/help|what can|capabilities|features|built|done/i.test(lower)) return 'help';
    return 'general';
  }

  private requiresApprovalCheck(message: string, intent: string): boolean {
    const lower = message.toLowerCase();
    const highRiskPatterns = [
      /send (message|reply|email|text|sms|dm|direct message)/i,
      /publish|schedule|post to/i,
      /contact (lead|customer|client|student)/i,
      /change (booking|appointment|schedule|price|offer|policy)/i,
      /delete (data|file|record|client|message)/i,
      /spend|money|cost|budget/i,
      /push.*main|merge.*main|deploy|release/i,
      /change (credential|password|permission|security|key|token)/i,
      /share.*private|send.*private/i,
    ];
    for (const pattern of highRiskPatterns) {
      if (pattern.test(lower)) return true;
    }
    if (intent === 'action') return true;
    if (intent === 'marketing' && /publish|schedule|post|send/i.test(lower)) return true;
    return false;
  }

  private getApprovalReason(intent: string): string {
    const reasons: Record<string, string> = {
      build: 'This would change code or create new features. Approval ensures you review before anything is built.',
      marketing: 'Publishing or contacting audiences requires your review first.',
      crm: 'Changing client data or sending messages requires your approval.',
      action: 'This action affects real data or external systems. Approval required.',
      report: 'Reports can be prepared without approval — no action needed.',
      help: 'Help requests don\'t require approval.',
      general: 'General requests don\'t require approval unless they involve an external action.',
    };
    return reasons[intent] || 'This may affect real data. Approval required.';
  }

  private async createOrchestratorTask(workspaceId: string, message: string, intent: string, requiresApproval: boolean) {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_orchestrator_tasks')
      .insert({
        workspace_id: workspaceId,
        user_message: message,
        intent,
        requires_approval: requiresApproval,
        status: requiresApproval ? 'awaiting_approval' : 'queued',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to create task: ${error.message}`);
    return data;
  }

  private formulateAnswer(message: string, intent: string, task: any, requiresApproval: boolean): string {
    if (requiresApproval) {
      return `I understand you want to ${intent}. I've prepared this for your review — I'll need your approval before I do anything that affects real data or external systems. Your task ID is ${task.id}.`;
    }
    const responses: Record<string, string> = {
      build: `Got it — you want to build something. I've queued this as a build task (ID: ${task.id}). I'll work on it and report back when there's progress.`,
      marketing: `Understood — marketing related. I've queued this (ID: ${task.id}). I'll research and report back with recommendations.`,
      crm: `Got it — CRM related. I've queued this (ID: ${task.id}). I'll organize and report back.`,
      report: `Understood — you want a report. I've queued this (ID: ${task.id}). I'll gather the info and give you a summary.`,
      help: `Here's what I can help with:\n\n**Build:** code, features, pages, components, fixes\n**Marketing:** content, posts, audience research, campaigns\n**CRM:** clients, inquiries, bookings, follow-ups\n**Reports:** status, analytics, summaries\n\nJust tell me what you need.`,
      general: `Got it. I've queued this (ID: ${task.id}) and will work on it.`,
    };
    return responses[intent] || responses.general;
  }
}
