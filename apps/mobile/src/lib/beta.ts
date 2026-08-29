import { apiFetch } from './api';

export interface BetaAccess {
  approved: boolean;
  founderBypass: boolean;
  cohort?: string | null;
  approvedAt?: string | null;
  workspaceId?: string | null;
}

export interface BetaOverview {
  release: { stage: string; public_signup_enabled: boolean };
  counts: {
    approvedTesters: number;
    students: number;
    outsideBusinesses: number;
    activeOutside7d: number;
    activeOutside30d: number;
    feedback: number;
    testimonialCandidates: number;
    urgentOpen: number;
  };
  averageRating: number | null;
  criteria: Array<{ key: string; label: string; pass: boolean; current: number | null; target: number }>;
  readiness: 'not_ready'|'progressing'|'ready_for_founder_review';
  founderDecisionRequired: boolean;
}

export const getBetaAccess = () => apiFetch<BetaAccess>('/beta/me');
export const redeemBetaInvite = (token: string) => apiFetch<BetaAccess>('/beta/redeem', { method: 'POST', body: JSON.stringify({ token }) });
export const submitBetaFeedback = (workspaceId: string, input: { category: string; message: string; rating?: number; permissionToContact?: boolean; permissionToQuote?: boolean }) => apiFetch(`/beta/workspaces/${workspaceId}/feedback`, { method: 'POST', body: JSON.stringify(input) });

export const getFounderBetaOverview = () => apiFetch<BetaOverview>('/founder/beta/overview');
export const listBetaInvites = () => apiFetch<any[]>('/founder/beta/invites');
export const createBetaInvite = (input: { emailHint?: string; cohort?: string; label?: string; region?: string; expiresInDays?: number }) => apiFetch<any>('/founder/beta/invites', { method: 'POST', body: JSON.stringify(input) });
export const revokeBetaInvite = (id: string) => apiFetch<any>(`/founder/beta/invites/${id}/revoke`, { method: 'POST' });
export const revokeBetaTester = (userId: string) => apiFetch<any>(`/founder/beta/testers/${userId}/revoke`, { method: 'POST' });
export const listBetaFeedback = () => apiFetch<any[]>('/founder/beta/feedback');
export const updateBetaFeedback = (id: string, input: { status?: string; founderNote?: string }) => apiFetch<any>(`/founder/beta/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
