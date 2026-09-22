import { HermesBuilderResultRecorder } from './hermes-builder-result-recorder.service';
export declare class N8nCallbackController {
    private readonly recorder;
    constructor(recorder: HermesBuilderResultRecorder);
    callback(body: {
        taskId: string;
        executionId?: string;
        result?: Record<string, any>;
        error?: string;
    }): Promise<{
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
}
