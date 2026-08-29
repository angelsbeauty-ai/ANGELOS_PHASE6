import { apiFetch } from './api';
export async function trackProductEvent(workspaceId: string, event: { eventName: 'screen_view'|'screen_duration'|'feature_used'|'workflow_started'|'workflow_completed'|'workflow_abandoned'|'tap'; screen?: string; feature?: string; actionKey?: string; outcome?: string; durationMs?: number }) {
  try { await apiFetch(`/workspaces/${workspaceId}/product-analytics/events`, { method: 'POST', body: JSON.stringify(event) }); }
  catch { /* Product analytics must never interrupt business work. */ }
}
