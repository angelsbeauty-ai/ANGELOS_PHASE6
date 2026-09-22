export declare class N8nHermesService {
    createTask(body: Record<string, any>): Promise<any>;
    getOverview(workspaceId: string): Promise<{
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
    executeTask(taskId: string, model?: string, timeoutMs?: number): Promise<import("./hermes-builder-executor.service").ExecuteTaskResult>;
}
