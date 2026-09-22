import type { AuthUser } from '../auth/auth-user';
export declare function flow1StagingEnabled(workspaceId: string): boolean;
export declare class StagingMessageExecutionService {
    private readonly manualAdapter;
    private assertEnabled;
    private rpc;
    prepare(user: AuthUser, workspaceId: string, sourceId: string, content: string, clientId: string, channel: string): Promise<any>;
    decide(user: AuthUser, workspaceId: string, decision: {
        approvalId: string;
        decision: string;
        notes?: string;
        revisedContent?: string;
    }): Promise<any>;
    execute(user: AuthUser, workspaceId: string, approvalId: string): Promise<{
        status: any;
        duplicatePrevented: boolean;
        attemptId: any;
    }>;
}
