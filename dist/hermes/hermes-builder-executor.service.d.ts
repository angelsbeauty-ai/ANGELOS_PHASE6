export interface ExecuteTaskRequest {
    taskId: string;
    model?: string;
    timeoutMs?: number;
    executionId?: string;
}
export interface ExecuteTaskResult {
    success: boolean;
    taskId: string;
    status: 'done' | 'failed' | 'timeout';
    files_changed?: string[];
    summary?: string;
    test_result?: {
        status: string;
        passed: number;
        failed: number;
    };
    error?: string;
    durationMs?: number;
}
export declare class HermesBuilderExecutor {
    execute(request: ExecuteTaskRequest): Promise<ExecuteTaskResult>;
    private executeTask;
    private fireCallback;
    private buildTelegramText;
    private sleep;
}
