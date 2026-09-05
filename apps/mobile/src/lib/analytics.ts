import { apiFetch } from './api';

export interface AnalyticsMetricSet {
  reach: number | null;
  impressions: number | null;
  views: number | null;
  watch_time_seconds: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  profile_visits: number | null;
  link_clicks: number | null;
  dms: number | null;
  inquiries: number | null;
  bookings: number | null;
  revenue: number | null;
  average_completion_rate?: number | null;
}

export interface AnalyticsPostSummary {
  variantId: string;
  contentPostId: string;
  title: string;
  objective: string | null;
  platform: string;
  format: string;
  publishedAt: string | null;
  businessScore: string;
  metrics: Record<string, number | string | null> | null;
}

export interface AnalyticsOverview {
  operatingCosts: { planPrice: { amountCents: number; currency: string; interval: string; status: string } | null; actualTotal: null; ai: null; messaging: null; hosting: null; explanation: string };
  period: { days: number; start: string; end: string };
  workspace: { id: string; name: string; timezone: string; currency: string };
  profile: { primary_goal?: string; experience_level?: string; service_area?: string | null; city?: string | null; region?: string | null; country?: string | null; local_context_enabled?: boolean };
  totals: AnalyticsMetricSet;
  topPost: AnalyticsPostSummary | null;
  strongestByGoal: Record<string, AnalyticsPostSummary | null>;
  postingWindow: { source: string; confidence: 'low' | 'medium' | 'high'; label: string | null; message?: string };
  patterns: { byFormat: PatternRow[]; byPlatform: PatternRow[]; byObjective: PatternRow[] };
  evidence: { publishedVariants: number; measuredVariants: number; audienceActivitySamples: number; ownedDataConfidence: 'low' | 'medium' | 'high'; localContext: Record<string, unknown> };
  recentPosts: AnalyticsPostSummary[];
}

export interface PatternRow {
  key: string;
  count: number;
  bookings: number;
  inquiries: number;
  saves: number;
  profileVisits: number;
  averageBusinessScore: number;
}

export interface MarketingCoachResponse {
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
  provider: string;
  model: string;
  evidence: AnalyticsOverview;
}

export interface MarketingProfile {
  workspace_id: string;
  primary_goal: string;
  target_client: string | null;
  service_area: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  experience_level: string;
  content_preferences: Record<string, unknown>;
  local_context_enabled: boolean;
}

export function getAnalyticsOverview(workspaceId: string, days = 30) {
  return apiFetch<AnalyticsOverview>(`/workspaces/${workspaceId}/analytics/overview?days=${days}`);
}

export function runMarketingCoach(workspaceId: string, days = 30) {
  return apiFetch<MarketingCoachResponse>(`/workspaces/${workspaceId}/analytics/marketing-coach?days=${days}`, { method: 'POST' });
}

export function getMarketingProfile(workspaceId: string) {
  return apiFetch<MarketingProfile>(`/workspaces/${workspaceId}/analytics/marketing-profile`);
}

export function updateMarketingProfile(workspaceId: string, input: Record<string, unknown>) {
  return apiFetch<MarketingProfile>(`/workspaces/${workspaceId}/analytics/marketing-profile`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function recordDemoContentMetrics(workspaceId: string, variantId: string, input: Record<string, unknown>) {
  return apiFetch(`/workspaces/${workspaceId}/analytics/content/${variantId}/metrics`, { method: 'POST', body: JSON.stringify(input) });
}
