export declare class CodexIntegrationController {
    private client;
    private conversation;
    private task;
    submit(workspaceId: string, body: {
        conversation_id: string;
        request_id: string;
        intent: string;
        task_text: string;
        task_json?: Record<string, any>;
    }): Promise<any>;
    status(workspaceId: string, taskId: string): Promise<{
        id: any;
        status: any;
        result: any;
        error: any;
        started_at: any;
        finished_at: any;
    }>;
    deliver(workspaceId: string, taskId: string): Promise<{
        delivered: boolean;
        task_id: any;
        message_id: any;
        already_delivered: boolean;
    }>;
}
