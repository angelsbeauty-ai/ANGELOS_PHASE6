import { Injectable, BadRequestException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../../config/supabase';

export interface SubAgentTask {
  id?: string;
  workspace_id: string;
  orchestrator_task_id: string;
  bot: 'angels_beauty' | 'academy' | 'angelos' | 'general';
  sub_agent: string;
  intent: string;
  task_description: string;
  status: 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'awaiting_approval';
  result?: Record<string, any>;
  error?: string;
  confidence?: number;
  requires_approval: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class SubAgentService {
  async createSubAgentTask(
    workspaceId: string,
    orchestratorTaskId: string,
    bot: SubAgentTask['bot'],
    subAgent: string,
    intent: string,
    taskDescription: string,
    requiresApproval: boolean,
  ): Promise<SubAgentTask> {
    const supabase = createServiceSupabaseClient();

    const { data, error } = await supabase
      .from('agent_sub_agent_tasks')
      .insert({
        workspace_id: workspaceId,
        orchestrator_task_id: orchestratorTaskId,
        bot,
        sub_agent: subAgent,
        intent,
        task_description: taskDescription,
        status: requiresApproval ? 'awaiting_approval' : 'queued',
        requires_approval: requiresApproval,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to create sub-agent task: ${error.message}`);
    return data;
  }

  async getSubAgentTask(taskId: string): Promise<SubAgentTask> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_sub_agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !data) throw new BadRequestException('Sub-agent task not found');
    return data;
  }

  async updateSubAgentTaskStatus(
    taskId: string,
    updates: Partial<Pick<SubAgentTask, 'status' | 'result' | 'error' | 'confidence' | 'approval_status'>>,
  ): Promise<SubAgentTask> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_sub_agent_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update sub-agent task: ${error.message}`);
    return data;
  }

  async listSubAgentTasks(workspaceId: string, limit = 50): Promise<SubAgentTask[]> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('agent_sub_agent_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(`Failed to list sub-agent tasks: ${error.message}`);
    return (data ?? []) as SubAgentTask[];
  }

  // PHASE 1: Simulate bot execution (no real bot logic yet)
  async executeBotTask(taskId: string, simulationResult: Record<string, any> = {}): Promise<SubAgentTask> {
    const task = await this.getSubAgentTask(taskId);

    // Simulate confidence score
    const confidence = 90; // Phase 1: assume high confidence for simulation

    return this.updateSubAgentTaskStatus(taskId, {
      status: 'completed',
      result: simulationResult,
      confidence,
    });
  }
}
