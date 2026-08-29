import { apiFetch } from './api';

export type ContentObjective = 'reach' | 'engagement' | 'saves' | 'profile_visits' | 'inquiries' | 'bookings' | 'education' | 'trust' | 'availability';
export type ContentPlatform = 'instagram' | 'facebook' | 'tiktok' | 'manual';

export interface ContentVariant {
  id: string;
  platform: ContentPlatform;
  format: 'reel' | 'story' | 'carousel' | 'photo';
  hook: string | null;
  caption: string;
  cta: string | null;
  hashtags: string[];
  scheduled_for: string | null;
  status: 'draft' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
  live_url?: string | null;
}

export interface ContentPost {
  id: string;
  title: string;
  objective: ContentObjective;
  primary_format: 'reel' | 'story' | 'carousel' | 'photo';
  status: string;
  strategy_reason: string | null;
  source_goal: string | null;
  editing_instructions: Record<string, unknown>;
  media?: Array<{ id: string; position: number; role: string; asset: { id: string; original_filename: string; media_type: string; content_status: string; marketing_permission: string } }>;
  variants?: ContentVariant[];
}

export interface ContentReview {
  reviewMode?: 'ai_vision' | 'metadata_fallback';
  recommendation: null | { mediaAssetIds: string[]; format: string; reason: string };
  reason?: string;
  candidates: Array<{ id: string; filename: string; mediaType: string; score: number; role: string; clientName: string | null }>;
}

export function listContent(workspaceId: string) {
  return apiFetch<ContentPost[]>(`/workspaces/${workspaceId}/content`);
}

export function getContentPost(workspaceId: string, postId: string) {
  return apiFetch<ContentPost>(`/workspaces/${workspaceId}/content/${postId}`);
}

export function reviewContentMedia(workspaceId: string, objective: ContentObjective) {
  return apiFetch<ContentReview>(`/workspaces/${workspaceId}/content/review-media`, { method: 'POST', body: JSON.stringify({ objective }) });
}

export function createContentDraft(workspaceId: string, input: { title: string; objective: ContentObjective; goal?: string; mediaAssetIds: string[]; platforms: ContentPlatform[] }) {
  return apiFetch<ContentPost>(`/workspaces/${workspaceId}/content`, { method: 'POST', body: JSON.stringify(input) });
}

export function approveContentPost(workspaceId: string, postId: string) {
  return apiFetch<ContentPost>(`/workspaces/${workspaceId}/content/${postId}/approve`, { method: 'POST' });
}

export function updateContentVariant(workspaceId: string, variantId: string, input: Record<string, unknown>) {
  return apiFetch<ContentVariant>(`/workspaces/${workspaceId}/content/variants/${variantId}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function scheduleContentVariant(workspaceId: string, variantId: string, scheduledFor: string) {
  return apiFetch<ContentVariant>(`/workspaces/${workspaceId}/content/variants/${variantId}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledFor }) });
}

export function publishContentVariant(workspaceId: string, variantId: string) {
  return apiFetch<{ variant: ContentVariant; published: boolean; duplicatePrevented: boolean }>(`/workspaces/${workspaceId}/content/variants/${variantId}/publish`, { method: 'POST' });
}
