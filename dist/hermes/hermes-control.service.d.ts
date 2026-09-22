export interface HermesOverview {
    workspaceId: string;
    pendingApprovals: number;
    needsAttention: number;
    pendingApprovalsItems: ApprovalItem[];
    attentionItems: AttentionItem[];
}
export interface ApprovalItem {
    id: string;
    type: 'message' | 'content' | 'booking';
    status: string;
    sourceId: string;
    sourceChannel: string;
    content: string;
    clientName: string;
    createdAt: string;
}
export interface AttentionItem {
    id: string;
    severity: string;
    title: string;
    summary: string;
    status: string;
    managedBy: string;
    createdAt: string;
}
export declare class HermesControlService {
    getOverviewAsSystem(workspaceId: string): Promise<{
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
    private getOverviewFromSupabase;
}
