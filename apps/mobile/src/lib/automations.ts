import { apiFetch } from './api';

export interface AutomationRule {
  id: string;
  name: string;
  category: string;
  trigger_type: string;
  action_type: string;
  enabled: boolean;
  delay_minutes: number;
}

export interface AutomationJob {
  id: string;
  scheduled_for: string;
  status: string;
  last_error: string | null;
  evidence: Record<string, unknown>;
  rule?: { name: string; category: string; trigger_type: string; action_type: string };
}

export function seedAutomationDefaults(workspaceId: string) {
  return apiFetch<AutomationRule[]>(`/workspaces/${workspaceId}/automations/seed-defaults`, { method: 'POST' });
}
export function listAutomationRules(workspaceId: string) {
  return apiFetch<AutomationRule[]>(`/workspaces/${workspaceId}/automations/rules`);
}
export function updateAutomationRule(workspaceId: string, ruleId: string, input: Record<string, unknown>) {
  return apiFetch<AutomationRule>(`/workspaces/${workspaceId}/automations/rules/${ruleId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export function listAutomationJobs(workspaceId: string) {
  return apiFetch<AutomationJob[]>(`/workspaces/${workspaceId}/automations/jobs`);
}
export function processDueAutomations(workspaceId: string) {
  return apiFetch<AutomationJob[]>(`/workspaces/${workspaceId}/automations/process-due`, { method: 'POST' });
}
