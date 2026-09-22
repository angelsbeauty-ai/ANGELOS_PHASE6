import type { AuthUser } from '../auth/auth-user';
import { StagingMessageExecutionService } from '../messaging/staging-message-execution.service';
interface ApprovalPayload {
    type: 'message' | 'content' | 'booking';
    sourceId: string;
    sourceChannel: string;
    content: string;
    clientId: string;
    clientName: string;
    context?: Record<string, any>;
    actionRequired?: string;
    workspaceId?: string;
}
interface ApprovalDecision {
    approvalId: string;
    decision: 'approved' | 'rejected' | 'needs_revision';
    notes?: string;
    revisedContent?: string;
}
export declare class ApprovalsService {
    private readonly stagingExecution;
    constructor(stagingExecution: StagingMessageExecutionService);
    private resolveWorkspaceId;
    private assertNotEmergencyPaused;
    private createApproval;
    createMessageApproval(user: AuthUser, payload: ApprovalPayload): Promise<any>;
    createContentApproval(user: AuthUser, payload: ApprovalPayload): Promise<any>;
    createBookingApproval(user: AuthUser, payload: ApprovalPayload): Promise<any>;
    submitApprovalDecision(user: AuthUser, decision: ApprovalDecision, workspaceId?: string): Promise<any>;
    executeMessageApproval(user: AuthUser, approvalId: string, workspaceId?: string): Promise<{
        status: any;
        duplicatePrevented: boolean;
        attemptId: any;
    }>;
    private executeApprovalDecision;
    getPendingApprovals(user: AuthUser, limit?: number, workspaceId?: string): Promise<any[]>;
    getApprovalById(user: AuthUser, approvalId: string, workspaceId?: string): Promise<any>;
    private notifyApprovalNeeded;
    getApprovalHistory(user: AuthUser, clientId?: string, type?: string, limit?: number, workspaceId?: string): Promise<any[]>;
}
export {};
