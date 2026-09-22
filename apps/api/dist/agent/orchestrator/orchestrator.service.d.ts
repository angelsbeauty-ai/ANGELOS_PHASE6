export interface OrchestratorTask {
    id: string;
    workspace_id: string;
    user_message: string;
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
export declare class OrchestratorService {
    createTask(workspaceId: string, userMessage: string, intent: string, requiresApproval: boolean): Promise<OrchestratorTask>;
    assignTask(taskId: string): Promise<TaskAssignment>;
    private routeToBot;
    getTask(taskId: string): Promise<OrchestratorTask>;
    updateTaskStatus(taskId: string, updates: Partial<Pick<OrchestratorTask, 'status' | 'result' | 'error' | 'confidence' | 'approval_status'>>): Promise<OrchestratorTask>;
    listTasks(workspaceId: string, limit?: number): Promise<OrchestratorTask[]>;
}
