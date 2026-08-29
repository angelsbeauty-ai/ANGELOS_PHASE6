import { apiFetch } from './api';
export const getFounderMe = () => apiFetch<{ founder: boolean; userId: string; email?: string | null }>('/founder/me');
export const getFounderOverview = () => apiFetch<any>('/founder/overview');
export const listFounderWorkspaces = () => apiFetch<any[]>('/founder/workspaces');
export const listFeatureFlags = () => apiFetch<any[]>('/founder/feature-flags');
export const updateFeatureFlag = (key: string, patch: { enabled?: boolean; stage?: string }) => apiFetch<any>(`/founder/feature-flags/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const createStudentDiscount = (input: { emailHint?: string; discountPercent?: number }) => apiFetch<any>('/founder/student-discounts', { method: 'POST', body: JSON.stringify(input) });
export const listStudentDiscounts = () => apiFetch<any[]>('/founder/student-discounts');
export const revokeStudentDiscount = (id: string) => apiFetch<any>(`/founder/student-discounts/${id}/revoke`, { method: 'POST' });
