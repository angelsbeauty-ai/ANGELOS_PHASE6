import { apiFetch } from './api';

export interface FinanceOverview {
  days: number;
  actualIncome: number;
  byMethod: Record<string, number>;
  entries: Array<{ id: string; entry_type: string; amount: number; currency: string; method: string | null; occurred_at: string; client_id: string; appointment_id: string | null }>;
}

export function getFinanceOverview(workspaceId: string, days = 30) {
  return apiFetch<FinanceOverview>(`/workspaces/${workspaceId}/finance/overview?days=${days}`);
}

export function recordFinanceEntry(workspaceId: string, input: Record<string, unknown>) {
  return apiFetch(`/workspaces/${workspaceId}/finance/entries`, { method: 'POST', body: JSON.stringify(input) });
}
