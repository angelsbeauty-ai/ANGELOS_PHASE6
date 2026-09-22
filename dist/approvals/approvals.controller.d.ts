import { ApprovalsService } from './approvals.service';
import type { AuthUser } from '../auth/auth-user';
export declare class ApprovalsController {
    private approvalsService;
    constructor(approvalsService: ApprovalsService);
    createMessageApproval(user: AuthUser, body: {
        sourceId: string;
        sourceChannel: 'line' | 'instagram' | 'facebook' | 'tiktok' | 'manual';
        content: string;
        clientId: string;
        clientName: string;
        context?: Record<string, any>;
        workspaceId?: string;
    }): Promise<any>;
    createContentApproval(user: AuthUser, body: {
        sourceId: string;
        sourceChannel: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
        content: string;
        clientId?: string;
        clientName: string;
        context?: {
            imageUrl?: string;
            videoUrl?: string;
            platform?: string;
        };
        workspaceId?: string;
    }): Promise<any>;
    createBookingApproval(user: AuthUser, body: {
        sourceId: string;
        sourceChannel: string;
        content: string;
        clientId: string;
        clientName: string;
        context?: {
            serviceType?: string;
            requestedDate?: string;
            availability?: string[];
        };
        workspaceId?: string;
    }): Promise<any>;
    submitDecision(user: AuthUser, body: {
        approvalId: string;
        decision: 'approved' | 'rejected' | 'needs_revision';
        notes?: string;
        revisedContent?: string;
        workspaceId?: string;
    }): Promise<any>;
    getPendingApprovals(user: AuthUser, limit?: string, workspaceId?: string): Promise<any[]>;
    executeMessage(user: AuthUser, id: string, body: {
        workspaceId?: string;
    }): Promise<{
        status: any;
        duplicatePrevented: boolean;
        attemptId: any;
    }>;
    getHistory(user: AuthUser, clientId?: string, type?: string, limit?: string, workspaceId?: string): Promise<any[]>;
    getApprovalById(user: AuthUser, id: string, workspaceId?: string): Promise<any>;
}
