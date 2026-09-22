export type AssistantRoleKey = 'personal_assistant' | 'social_media_marketer' | 'content_creator' | 'business_manager' | 'business_advisor' | 'consultant';
export declare class UpdateAssistantRolesDto {
    roles: Partial<Record<AssistantRoleKey, boolean>>;
}
