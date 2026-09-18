import { supabase } from './supabase';
import { getApiBaseUrl } from './api-access';

export class ApiError extends Error {
  constructor(public status: number, public payload: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const apiUrl = await getApiBaseUrl();

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const raw = await response.text();
  let payload: unknown = raw;
  if (raw) {
    try { payload = JSON.parse(raw); } catch { /* keep text */ }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : raw || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, payload, message);
  }

  return payload as T;
}
