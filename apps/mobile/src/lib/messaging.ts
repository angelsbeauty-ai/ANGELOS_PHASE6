import { apiFetch } from './api';

export interface MessagingChannel {
  id: string;
  provider: 'instagram' | 'facebook' | 'line' | 'tiktok' | 'manual';
  display_name: string;
  status: string;
  capabilities: Record<string, unknown>;
}

export interface MessageThreadSummary {
  id: string;
  contact_display_name: string | null;
  status: string;
  intent: string;
  priority: 'urgent' | 'today' | 'later';
  needs_owner: boolean;
  last_message_at: string | null;
  channel: MessagingChannel | null;
  client: { id: string; display_name: string; language: string; do_not_auto_message: boolean } | null;
}

export interface ClientMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'client' | 'owner' | 'ai' | 'system';
  body: string;
  translated_body: string | null;
  status: string;
  sensitive: boolean;
  created_at: string;
  sent_at: string | null;
}

export interface MessageThreadDetail {
  thread: MessageThreadSummary & { external_thread_id: string };
  messages: ClientMessage[];
  internalNotes: Array<{ id: string; content: string; created_at: string }>;
}

export function listMessagingChannels(workspaceId: string) {
  return apiFetch<MessagingChannel[]>(`/workspaces/${workspaceId}/messaging/channels`);
}

export function createDemoMessagingChannel(workspaceId: string) {
  return apiFetch<MessagingChannel>(`/workspaces/${workspaceId}/messaging/channels/demo`, {
    method: 'POST', body: JSON.stringify({})
  });
}

export function listMessageThreads(workspaceId: string) {
  return apiFetch<MessageThreadSummary[]>(`/workspaces/${workspaceId}/messaging/threads`);
}

export function getMessageThread(workspaceId: string, threadId: string) {
  return apiFetch<MessageThreadDetail>(`/workspaces/${workspaceId}/messaging/threads/${threadId}`);
}

export function createAiReplyDraft(workspaceId: string, threadId: string) {
  return apiFetch<{ message: ClientMessage; requiresApproval: boolean; reason: string }>(
    `/workspaces/${workspaceId}/messaging/threads/${threadId}/ai-draft`, { method: 'POST' }
  );
}

export function createMessageReply(workspaceId: string, threadId: string, body: string, sendNow = false) {
  return apiFetch<{ message: ClientMessage; sent: boolean }>(`/workspaces/${workspaceId}/messaging/threads/${threadId}/replies`, {
    method: 'POST', body: JSON.stringify({ body, sendNow })
  });
}

export function approveAndSendMessage(workspaceId: string, messageId: string) {
  return apiFetch<{ message: ClientMessage; sent: boolean; duplicatePrevented?: boolean }>(
    `/workspaces/${workspaceId}/messaging/messages/${messageId}/approve-send`, { method: 'POST' }
  );
}

export function addThreadInternalNote(workspaceId: string, threadId: string, content: string) {
  return apiFetch(`/workspaces/${workspaceId}/messaging/threads/${threadId}/internal-notes`, {
    method: 'POST', body: JSON.stringify({ content })
  });
}

export function ingestDemoMessage(workspaceId: string, channelId: string, body: string, contactDisplayName = 'Demo Client') {
  const suffix = Date.now().toString();
  return apiFetch<{ threadId: string }>(`/workspaces/${workspaceId}/messaging/ingest-demo`, {
    method: 'POST',
    body: JSON.stringify({
      channelId,
      externalThreadId: `demo-thread-${suffix}`,
      externalUserId: `demo-user-${suffix}`,
      contactDisplayName,
      body
    })
  });
}

export function translateClientMessage(workspaceId: string, messageId: string, targetLanguage: string) {
  return apiFetch<ClientMessage>(`/workspaces/${workspaceId}/messaging/messages/${messageId}/translate`, {
    method: 'POST', body: JSON.stringify({ targetLanguage })
  });
}
