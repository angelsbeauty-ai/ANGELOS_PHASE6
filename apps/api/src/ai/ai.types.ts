export type AssistantRoleKey =
  | 'personal_assistant'
  | 'social_media_marketer'
  | 'content_creator'
  | 'business_manager'
  | 'business_advisor'
  | 'consultant';

export interface AssistantProfile {
  workspace_id: string;
  display_name: string;
  avatar_key: string | null;
  personality_prompt: string;
  primary_language: string;
  tone: string;
  response_length: 'concise' | 'balanced' | 'detailed';
  proactivity: 'low' | 'balanced' | 'high';
  floating_button_mode: 'on' | 'compact' | 'off';
  guidance_questions_enabled: boolean;
  explain_recommendations: boolean;
}

export interface AssistantRoleRow {
  role_key: AssistantRoleKey;
  enabled: boolean;
}

export interface AiMessageRow {
  id: string;
  author_type: 'user' | 'assistant' | 'system_action';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiProviderRequest {
  instructions: string;
  input: string;
  imageUrls?: string[];
}

export interface AiProviderResponse {
  text: string;
  provider: 'openai' | 'mock';
  model: string;
}
