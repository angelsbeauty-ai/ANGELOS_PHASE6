import { IsObject } from 'class-validator';

export type AssistantRoleKey =
  | 'personal_assistant'
  | 'social_media_marketer'
  | 'content_creator'
  | 'business_manager'
  | 'business_advisor'
  | 'consultant';

export class UpdateAssistantRolesDto {
  @IsObject()
  roles!: Partial<Record<AssistantRoleKey, boolean>>;
}
