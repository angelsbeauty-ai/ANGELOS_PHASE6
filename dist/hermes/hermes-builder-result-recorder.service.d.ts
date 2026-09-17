export declare class HermesBuilderResultRecorder {
    recordResult(taskId: string, executionId: string, result: Record<string, any>, error?: string): Promise<{
        success: boolean;
        taskId: string;
        error: string;
        status?: undefined;
    } | {
        success: boolean;
        taskId: string;
        status: string;
        error?: undefined;
    }>;
    private fireCallback;
}
