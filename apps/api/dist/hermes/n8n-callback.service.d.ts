export declare class N8nCallbackService {
    recordTaskResult(taskId: string, executionId: string, result: Record<string, any>, error?: string): Promise<{
        success: boolean;
        taskId: string;
        status: string;
        executionId: string;
    }>;
    private fireCallback;
    private buildReply;
    private listItems;
}
