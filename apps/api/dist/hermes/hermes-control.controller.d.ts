import { HermesTaskService } from './hermes-task.service';
import { HermesControlService } from './hermes-control.service';
import type { AuthUser } from '../auth/auth-user';
export declare class HermesControlController {
    private readonly hermesTask;
    private readonly hermesControl;
    constructor(hermesTask: HermesTaskService, hermesControl: HermesControlService);
    createTask(user: AuthUser, workspaceId: string, body: {
        source_ref?: string;
        source?: string;
        source_channel?: string;
        intent: string;
        task_text: string;
        task_json?: Record<string, any>;
        needs_owner_approval?: boolean;
        n8n_execution_id?: string;
        n8n_callback_url?: string;
    }): Promise<any>;
    listTasks(user: AuthUser, workspaceId: string, limit?: string): Promise<any[]>;
    getTask(user: AuthUser, workspaceId: string, taskId: string): Promise<any>;
    getTaskStatus(user: AuthUser, workspaceId: string, taskId: string): Promise<any>;
    approveTask(user: AuthUser, workspaceId: string, taskId: string): Promise<any>;
    recordResult(user: AuthUser, workspaceId: string, taskId: string, body: {
        result?: Record<string, any>;
        error?: string;
        hermes_session_id?: string;
    }): Promise<any>;
    getOverview(user: AuthUser, workspaceId: string): Promise<{
        workspaceId: string;
        pendingApprovals: number;
        needsAttention: number;
        pendingApprovalsItems: {
            id: any;
            type: any;
            status: any;
            sourceId: any;
            sourceChannel: any;
            content: any;
            clientName: any;
            createdAt: any;
        }[];
        attentionItems: {
            id: any;
            severity: any;
            title: any;
            summary: any;
            status: any;
            managedBy: any;
            createdAt: any;
        }[];
    }>;
}
