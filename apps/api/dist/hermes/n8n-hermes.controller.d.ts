import { HermesSystemService } from './hermes-system.service';
import { HermesControlService } from './hermes-control.service';
import { HermesBuilderExecutor } from './hermes-builder-executor.service';
export declare class N8nHermesController {
    private readonly systemTaskService;
    private readonly controlService;
    private readonly builderExecutor;
    constructor(systemTaskService: HermesSystemService, controlService: HermesControlService, builderExecutor: HermesBuilderExecutor);
    createTask(workspaceIdParam: string, body: {
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
    overviewPost(body: {
        workspaceId?: string;
    } | undefined): Promise<{
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
    overviewGet(workspaceIdQuery?: string, workspaceIdParam?: string): Promise<{
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
    execute(body: {
        taskId: string;
        model?: string;
        timeoutMs?: number;
    }): Promise<import("./hermes-builder-executor.service").ExecuteTaskResult>;
}
