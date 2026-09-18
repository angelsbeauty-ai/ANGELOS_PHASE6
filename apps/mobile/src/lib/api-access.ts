import AsyncStorage from '@react-native-async-storage/async-storage';
import { runtimeConfig } from './runtime-config';

const STORAGE_KEY = 'angelos.apiUrl';

export function defaultApiUrl(): string {
  return runtimeConfig.apiUrl.replace(/\/$/, '');
}

export async function getApiBaseUrl(): Promise<string> {
  const override = (await AsyncStorage.getItem(STORAGE_KEY))?.trim();
  if (override) return override.replace(/\/$/, '');
  return defaultApiUrl();
}

export async function setApiBaseUrl(url: string): Promise<string> {
  const clean = url.trim().replace(/\/$/, '');
  if (!clean) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return defaultApiUrl();
  }
  await AsyncStorage.setItem(STORAGE_KEY, clean);
  return clean;
}

export async function pingApi(baseUrl?: string): Promise<{ ok: boolean; status: number; body: string; url: string }> {
  const base = (baseUrl ?? (await getApiBaseUrl())).replace(/\/$/, '');
  const url = `${base}/health/ready`;
  try {
    const response = await fetch(url, { method: 'GET' });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body: body.slice(0, 400), url };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : String(error),
      url
    };
  }
}
