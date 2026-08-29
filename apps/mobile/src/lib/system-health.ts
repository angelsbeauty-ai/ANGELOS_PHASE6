import { apiFetch } from './api';

export type HealthStatus = 'healthy' | 'degraded' | 'needs_attention' | 'disconnected' | 'paused' | 'unknown';
export type AttentionSeverity = 'urgent' | 'today' | 'later';

export interface HealthComponent {
  id: string;
  component: string;
  capability: string;
  provider: string | null;
  status: HealthStatus;
  summary: string;
  impact: Record<string, unknown>;
  details: Record<string, unknown>;
  action_path: string | null;
  last_checked_at: string;
  last_success_at: string | null;
}

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  category: string;
  title: string;
  summary: string;
  status: 'open' | 'acknowledged' | 'resolved';
  action_path: string | null;
  last_seen_at: string;
}

export interface OperationalControls {
  workspace_id: string;
  pause_ai_actions: boolean;
  pause_automations: boolean;
  emergency_read_only: boolean;
  reason: string | null;
  updated_at: string;
}

export interface SystemHealthOverview {
  overallStatus: HealthStatus;
  counts: { urgent: number; today: number; later: number };
  controls: OperationalControls;
  components: HealthComponent[];
  attention: AttentionItem[];
}

export function getSystemHealth(workspaceId: string) {
  return apiFetch<SystemHealthOverview>(`/workspaces/${workspaceId}/system-health`);
}

export function runSystemHealthCheck(workspaceId: string) {
  return apiFetch<SystemHealthOverview>(`/workspaces/${workspaceId}/system-health/run`, { method: 'POST' });
}

export function acknowledgeAttention(workspaceId: string, attentionId: string) {
  return apiFetch<AttentionItem>(`/workspaces/${workspaceId}/system-health/attention/${attentionId}/acknowledge`, { method: 'POST' });
}

export function updateOperationalControls(workspaceId: string, input: { pauseAiActions?: boolean; pauseAutomations?: boolean; emergencyReadOnly?: boolean; reason?: string }) {
  return apiFetch<OperationalControls>(`/workspaces/${workspaceId}/system-health/controls`, { method: 'PATCH', body: JSON.stringify(input) });
}
