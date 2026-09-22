export declare class HermesSystemService {
    createAsSystem(workspaceId: string, body: {
        source_ref?: string;
        source?: string;
        source_channel?: string;
        intent: string;
        task_text: string;
        task_json?: Record<string, any>;
        needs_owner_approval?: boolean;
        n8n_execution_id?: string;
        n8n_callback_url?: string;
    }, n8nExecutionId?: string): Promise<any>;
    getOneAsSystem(taskId: string): Promise<any>;
}
