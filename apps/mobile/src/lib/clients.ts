import { apiFetch } from './api';

export interface ClientSummary {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  language: string;
  status: string;
  source: string | null;
  do_not_auto_message: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientDetail {
  client: ClientSummary;
  notes: Array<{ id: string; note_type: string; content: string; created_at: string }>;
  treatments: Array<{ id: string; service_name: string; stage: string; technique: string | null; performed_at: string; notes: string | null }>;
  consents: Array<{ id: string; consent_type: string; status: string; scope: Record<string, unknown>; created_at: string }>;
  payments: Array<{ id: string; entry_type: string; amount: number; currency: string; method: string | null; occurred_at: string }>;
  followups: Array<{ id: string; reason: string; due_at: string | null; status: string }>;
}

export function listClients(workspaceId: string, search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiFetch<ClientSummary[]>(`/workspaces/${workspaceId}/clients${query}`);
}

export function getClient(workspaceId: string, clientId: string) {
  return apiFetch<ClientDetail>(`/workspaces/${workspaceId}/clients/${clientId}`);
}

export function createClient(workspaceId: string, input: Record<string, unknown>) {
  return apiFetch<ClientSummary>(`/workspaces/${workspaceId}/clients`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateClient(workspaceId: string, clientId: string, input: Record<string, unknown>) {
  return apiFetch<ClientSummary>(`/workspaces/${workspaceId}/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

export type ConsentType = 'treatment' | 'photo_video' | 'marketing' | 'model_student' | 'policy_acknowledgement';
export type ConsentStatus = 'granted' | 'denied' | 'withdrawn';

export function recordConsent(workspaceId: string, clientId: string, consentType: ConsentType, status: ConsentStatus) {
  return apiFetch(`/workspaces/${workspaceId}/clients/${clientId}/consents`, {
    method: 'POST',
    body: JSON.stringify({ consentType, status })
  });
}

export function addClientNote(workspaceId: string, clientId: string, content: string) {
  return apiFetch(`/workspaces/${workspaceId}/clients/${clientId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ noteType: 'general', content })
  });
}

export function addTreatment(workspaceId: string, clientId: string, input: Record<string, unknown>) {
  return apiFetch(`/workspaces/${workspaceId}/clients/${clientId}/treatments`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
