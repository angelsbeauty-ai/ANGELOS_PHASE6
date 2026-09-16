import { Injectable, BadRequestException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../../config/supabase';

export interface OrchestratorTask {
  id: string;
  workspace_id: string;
  intent: string;
  task_description: string;
  status: 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'awaiting_approval';
  assigned_bot?: string;
  assigned_sub_agent?: string;
  result?: Record<string, any>;
  error?: string;
  confidence?: number;
  requires_approval: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  taskId: string;
  bot: 'angels_beauty' | 'academy' | 'angelos' | 'general';
  subAgent: string;
  reasoning: string;
}

@Injectable()
export class OrchestratorService {
  async createTask(workspaceId: string, userMessage: string, intent: string, requiresApproval: boolean): Promise<OrchestratorTask> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_orchestrator_tasks')
      .insert({
        workspace_id: workspaceId,
        user_message: userMessage,
        intent,
        requires_approval: requiresApproval,
        status: requiresApproval ? 'awaiting_approval' : 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to create orchestrator task: ${error.message}`);
    return data;
  }

  async assignTask(taskId: string): Promise<TaskAssignment> {
    const supabase = createServiceSupabaseClient();
    const { data: task } = await supabase
      .from('agent_orchestrator_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    if (!task) throw new BadRequestException('Task not found');

    const assignment = this.routeToBot(task.intent, task.user_message);

    await supabase
      .from('agent_orchestrator_tasks')
      .update({
        status: 'assigned',
        assigned_bot: assignment.bot,
        assigned_sub_agent: assignment.subAgent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return assignment;
  }

  private routeToBot(intent: string, message: string): TaskAssignment {
    const lower = message.toLowerCase();
    if (/build|code|fix|develop|program|implement|test|release|debug|deploy|create (app|feature|page|component|api|endpoint|service|controller|module)/i.test(lower)) {
      return { taskId: '', bot: 'angelos', subAgent: 'angelos-dev', reasoning: 'Development-related request — routed to AngelOS bot' };
    }
    if (/client|customer|inquiry|lead|booking|appointment|schedule|beauty|service|follow.up|esthetic|spa|salon/i.test(lower)) {
      return { taskId: '', bot: 'angels_beauty', subAgent: 'angels-beauty-crm', reasoning: 'Beauty business-related request — routed to Angels Beauty bot' };
    }
    if (/student|course|lesson|academy|class|enrollment|education|learn|teach|training|module|curriculum/i.test(lower)) {
      return { taskId: '', bot: 'academy', subAgent: 'academy-students', reasoning: 'Academy-related request — routed to Academy bot' };
    }
    if (/marketing|post|content|social|audience|growth|campaign|publish|analytics|metrics|performance|seo|hashtag/i.test(lower)) {
      return { taskId: '', bot: 'general', subAgent: 'marketing', reasoning: 'Marketing-related request — routed to marketing capability' };
    }
    return { taskId: '', bot: 'general', subAgent: 'general', reasoning: 'General request — routed to general capability' };
  }

  async getTask(taskId: string): Promise<OrchestratorTask> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_orchestrator_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    if (error || !data) throw new BadRequestException('Task not found');
    return data;
  }

  async updateTaskStatus(taskId: string, updates: Partial<Pick<OrchestratorTask, 'status' | 'result' | 'error' | 'confidence' | 'approval_status'>>): Promise<OrchestratorTask> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_orchestrator_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to update task: ${error.message}`);
    return data;
  }

  async listTasks(workspaceId: string, limit = 50): Promise<OrchestratorTask[]> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_orchestrator_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new BadRequestException(`Failed to list tasks: ${error.message}`);
    return (data ?? []) as OrchestratorTask[];
  }
}
