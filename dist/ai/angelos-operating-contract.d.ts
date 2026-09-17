import type { AssistantProfile, AssistantRoleRow } from './ai.types';
export declare function buildOperatingInstructions(input: {
    workspaceName: string;
    profile: AssistantProfile;
    roles: AssistantRoleRow[];
    approvedMemory: string[];
    context?: {
        screen?: string;
        entityType?: string;
        entityId?: string;
    };
    contextFacts?: string[];
}): string;
