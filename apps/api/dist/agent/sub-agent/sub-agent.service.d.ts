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
export declare class SubAgentService {
    createSubAgentTask(workspaceId: string, orchestratorTaskId: string, bot: SubAgentTask['bot'], subAgent: string, intent: string, taskDescription: string, requiresApproval: boolean): Promise<SubAgentTask>;
    getSubAgentTask(taskId: string): Promise<SubAgentTask>;
    updateSubAgentTaskStatus(taskId: string, updates: Partial<Pick<SubAgentTask, 'status' | 'result' | 'error' | 'confidence' | 'approval_status'>>): Promise<SubAgentTask>;
    listSubAgentTasks(workspaceId: string, limit?: number): Promise<SubAgentTask[]>;
    executeBotTask(taskId: string, simulationResult?: Record<string, any>): Promise<SubAgentTask>;
}
