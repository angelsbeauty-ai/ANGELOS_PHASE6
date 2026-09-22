export interface MainAgentRequest {
    workspaceId: string;
    userMessage: string;
    userContext?: Record<string, any>;
}
export interface MainAgentResponse {
    answer: string;
    confidence: number;
    status: 'done' | 'needs_review' | 'blocked';
    requiresApproval: boolean;
    approvalReason?: string;
    tasksCreated: number;
    evidence?: any[];
}
export declare class MainAgentService {
    handleRequest(request: MainAgentRequest): Promise<MainAgentResponse>;
    private classifyIntent;
    private requiresApprovalCheck;
    private getApprovalReason;
    private createOrchestratorTask;
    private formulateAnswer;
}
