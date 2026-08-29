import { apiFetch } from './api';
export interface SubscriptionStatus {
  subscription: any;
  plan: any;
  pricing: { currency: string; billingInterval: 'monthly'|'yearly'; baseCents: number; discountPercent: number; finalCents: number };
  access: { readEnabled: boolean; writeEnabled: boolean; aiEnabled: boolean; publishingEnabled: boolean; automationsEnabled: boolean; reason?: string | null };
  billingProvider: { name: string; configured: boolean };
  policy: { readOnlyDaysAfterCancellation: number; studentDiscountPercent: number };
}
export const getSubscription = (workspaceId: string) => apiFetch<SubscriptionStatus>(`/workspaces/${workspaceId}/subscription`);
export const requestCheckout = (workspaceId: string, billingInterval: 'monthly'|'yearly') => apiFetch<any>(`/workspaces/${workspaceId}/subscription/checkout`, { method: 'POST', body: JSON.stringify({ billingInterval }) });
export const cancelSubscription = (workspaceId: string) => apiFetch<any>(`/workspaces/${workspaceId}/subscription/cancel`, { method: 'POST' });
export const reactivateDemo = (workspaceId: string, billingInterval: 'monthly'|'yearly') => apiFetch<any>(`/workspaces/${workspaceId}/subscription/reactivate-demo`, { method: 'POST', body: JSON.stringify({ billingInterval }) });
export const redeemStudentDiscount = (workspaceId: string, token: string) => apiFetch<any>(`/workspaces/${workspaceId}/subscription/student-discount`, { method: 'POST', body: JSON.stringify({ token }) });
