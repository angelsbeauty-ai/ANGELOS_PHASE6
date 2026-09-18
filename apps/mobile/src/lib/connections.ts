import { apiFetch } from './api';

export interface ConnectionRow {
  provider: string;
  status: string;
  tokenPresent: boolean;
  expiresAt: string | null;
  expired: boolean;
}

export interface ChannelRow {
  provider: string;
  status: string;
  externalAccountIdPresent: boolean;
}

export interface MetaStatus {
  appCredentials: { configured: boolean };
  webhookVerifyToken: { configured: boolean };
  transport: { enabled: boolean; pinnedWorkspace: string | null };
  connections: ConnectionRow[];
  channels: ChannelRow[];
}

export interface LineStatus {
  appCredentials?: { configured: boolean };
  transport?: { enabled: boolean };
  connections?: ConnectionRow[];
  channels?: ChannelRow[];
  [key: string]: unknown;
}

export function getMetaStatus(workspaceId: string) {
  return apiFetch<MetaStatus>(`/workspaces/${workspaceId}/messaging/meta/status`);
}

export function getLineStatus(workspaceId: string) {
  return apiFetch<LineStatus>(`/workspaces/${workspaceId}/messaging/line/status`);
}

export function connectMeta(
  workspaceId: string,
  input: {
    provider: 'instagram' | 'facebook';
    displayName: string;
    externalAccountId: string;
    accessToken: string;
    accessExpiresAt: string;
  }
) {
  return apiFetch(`/workspaces/${workspaceId}/messaging/channels/meta`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function disconnectMeta(workspaceId: string, provider: 'instagram' | 'facebook') {
  return apiFetch(`/workspaces/${workspaceId}/messaging/channels/meta/${provider}/disconnect`, {
    method: 'POST'
  });
}

export function connectLine(
  workspaceId: string,
  input: {
    displayName: string;
    externalAccountId: string;
    accessToken: string;
    accessExpiresAt: string;
  }
) {
  return apiFetch(`/workspaces/${workspaceId}/messaging/channels/line`, {
    method: 'POST',
    body: JSON.stringify({ provider: 'line', ...input })
  });
}

export function disconnectLine(workspaceId: string) {
  return apiFetch(`/workspaces/${workspaceId}/messaging/channels/line/disconnect`, { method: 'POST' });
}

export function defaultExpiryIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 60);
  return d.toISOString();
}
