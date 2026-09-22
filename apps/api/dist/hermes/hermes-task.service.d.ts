import { AuthUser } from '../auth/auth-user';
export declare function validateBoundedCodexTask(body: {
    intent: string;
    task_text: string;
    task_json?: Record<string, any>;
}): {
    files: string[];
    acceptance_criteria: string[];
};
export declare class HermesTaskService {
    private workspaceId;
    create(user: AuthUser, body: {
        source_ref?: string;
        source?: string;
        source_channel?: string;
        intent: string;
        task_text: string;
        task_json?: Record<string, any>;
        needs_owner_approval?: boolean;
        n8n_execution_id?: string;
        n8n_callback_url?: string;
    }, workspaceId?: string): Promise<any>;
    getOne(user: AuthUser, taskId: string): Promise<any>;
    getOneForWorkspace(user: AuthUser, taskId: string, workspaceId?: string): Promise<any>;
    getCodexTaskStatus(user: AuthUser, taskId: string, workspaceId: string): Promise<any>;
    listRecent(user: AuthUser, limit?: number): Promise<any[]>;
    updateStatus(user: AuthUser, taskId: string, body: {
        status?: string;
        hermes_session_id?: string;
        hermes_result?: Record<string, any>;
        hermes_error?: string;
        hermes_started_at?: string;
        hermes_finished_at?: string;
        n8n_status?: string;
        approval_status?: string;
        approved_by?: string;
        approved_at?: string;
        needs_owner_approval?: boolean;
    }): Promise<any>;
}
