import { apiFetch } from './api';

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
  tone: 'warm_professional' | 'direct' | 'calm' | 'friendly' | 'custom';
  response_length: 'concise' | 'balanced' | 'detailed';
  proactivity: 'low' | 'balanced' | 'high';
  floating_button_mode: 'on' | 'compact' | 'off';
  guidance_questions_enabled: boolean;
  explain_recommendations: boolean;
}

export interface AssistantRole {
  role_key: AssistantRoleKey;
  enabled: boolean;
}

export interface AiMessage {
  id: string;
  author_type: 'user' | 'assistant' | 'system_action';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiActionProposal {
  id: string;
  action_key: string;
  risk_level: 'low' | 'medium' | 'high';
  status: string;
  summary?: string;
  requiresApproval?: boolean;
  input: Record<string, unknown>;
}

export async function getAssistantProfile(workspaceId: string) {
  return apiFetch<{ profile: AssistantProfile; roles: AssistantRole[] }>(
    `/workspaces/${workspaceId}/ai/profile`
  );
}

export async function updateAssistantProfile(workspaceId: string, updates: Record<string, unknown>) {
  return apiFetch<AssistantProfile>(`/workspaces/${workspaceId}/ai/profile`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function updateAssistantRoles(
  workspaceId: string,
  roles: Partial<Record<AssistantRoleKey, boolean>>
) {
  return apiFetch<{ profile: AssistantProfile; roles: AssistantRole[] }>(
    `/workspaces/${workspaceId}/ai/roles`,
    { method: 'PUT', body: JSON.stringify({ roles }) }
  );
}

export interface AiScreenContext {
  screen?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
}

export async function createConversation(workspaceId: string, context?: AiScreenContext) {
  return apiFetch<{ id: string }>(`/workspaces/${workspaceId}/ai/conversations`, {
    method: 'POST',
    body: JSON.stringify({
      title: context?.entityLabel ? `Assistant · ${context.entityLabel}` : 'Assistant',
      currentScreen: context?.screen ?? 'ai',
      currentEntityType: context?.entityType,
      currentEntityId: context?.entityId
    })
  });
}

export async function sendAiMessage(workspaceId: string, conversationId: string, message: string, context?: AiScreenContext) {
  return apiFetch<{ message: AiMessage; action: AiActionProposal | null }>(
    `/workspaces/${workspaceId}/ai/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message, context: context ?? { screen: 'ai' } })
    }
  );
}

export async function approveAiAction(workspaceId: string, actionId: string) {
  return apiFetch(`/workspaces/${workspaceId}/ai/actions/${actionId}/approve`, { method: 'POST' });
}

export async function cancelAiAction(workspaceId: string, actionId: string) {
  return apiFetch(`/workspaces/${workspaceId}/ai/actions/${actionId}/cancel`, { method: 'POST' });
}

export interface AiCredits {
  planCode: string;
  periodStart: string;
  allowance: number;
  used: number;
  remaining: number | 'unlimited';
  unlimited: boolean;
  openaiEnabled: boolean;
  note: string;
}

export async function getAiCredits(workspaceId: string) {
  return apiFetch<AiCredits>(`/workspaces/${workspaceId}/ai/credits`);
}
