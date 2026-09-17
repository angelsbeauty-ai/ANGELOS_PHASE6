export type PlannedAction = {
    actionKey: 'update_assistant_name';
    riskLevel: 'low';
    requiresApproval: true;
    input: {
        displayName: string;
    };
    summary: string;
} | {
    actionKey: 'propose_memory';
    riskLevel: 'medium';
    requiresApproval: true;
    input: {
        category: 'preference';
        content: string;
    };
    summary: string;
};
export declare function planSafeAssistantAction(message: string): PlannedAction | null;
