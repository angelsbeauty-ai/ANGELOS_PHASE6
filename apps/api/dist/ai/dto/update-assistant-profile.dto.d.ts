export declare class UpdateAssistantProfileDto {
    displayName?: string;
    avatarKey?: string | null;
    personalityPrompt?: string;
    primaryLanguage?: string;
    tone?: 'warm_professional' | 'direct' | 'calm' | 'friendly' | 'custom';
    responseLength?: 'concise' | 'balanced' | 'detailed';
    proactivity?: 'low' | 'balanced' | 'high';
    floatingButtonMode?: 'on' | 'compact' | 'off';
    guidanceQuestionsEnabled?: boolean;
    explainRecommendations?: boolean;
}
