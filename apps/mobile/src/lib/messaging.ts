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

export interface ClientControlAnalysis {
  intent: string;
  urgency: string;
  sentiment: string;
  treatment_or_topic: string;
  requested_date_time: string | null;
  risk_flags: string[];
  sensitive: boolean;
  needs_angel: boolean;
  recommended_action: string;
  recommended_next_action?: string;
  detected_language: 'ja' | 'en' | 'mixed' | 'unknown';
  client_message_english_meaning: string;
  translation_method: string;
  send_released: false;
  [key: string]: unknown;
}

export interface ClientControlReviewItem {
  draft_message_id: string;
  thread_id: string;
  client: { id: string; display_name: string; language: string; status: string } | null;
  suggested_reply: string;
  english_meaning: string;
  analysis: ClientControlAnalysis;
  review_status: string;
  created_at: string;
  approval_required: true;
  send_released: false;
}

export interface ClientControlReviewQueue {
  ok: boolean;
  items: ClientControlReviewItem[];
}

export interface ClientControlReviewDetail {
  ok: boolean;
  draft: ClientControlReviewItem & {
    message_status: string;
    sensitive: boolean;
  };
  source_message: {
    message_id: string;
    original_body: string;
    original_language: string | null;
    english_meaning: string | null;
    received_at: string;
  } | null;
  client: ClientControlReviewItem['client'] & {
    do_not_auto_message?: boolean;
  };
  thread: {
    id: string;
    status: string;
    intent: string;
    priority: string;
    needs_owner: boolean;
  };
  client_context: {
    recent_messages?: Array<{
      id: string;
      direction: string;
      body: string;
      original_language?: string | null;
      translated_body?: string | null;
      created_at: string;
    }>;
    recent_appointments?: Array<{
      service_name: string;
      start_at: string;
      end_at: string;
      status: string;
    }>;
    [key: string]: unknown;
  };
  audit_history: Array<{
    event_type: string;
    actor_type: string;
    actor_user_id: string | null;
    evidence: Record<string, unknown>;
    created_at: string;
  }>;
}

export type ClientControlReviewDecision = 'approve' | 'edit' | 'reject';

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

export function getClientControlReviewQueue(workspaceId: string) {
  return apiFetch<ClientControlReviewQueue>('/workspaces/' + workspaceId + '/messaging/client-control/review-queue');
}

export function getClientControlReviewDetail(workspaceId: string, messageId: string) {
  return apiFetch<ClientControlReviewDetail>('/workspaces/' + workspaceId + '/messaging/client-control/drafts/' + messageId);
}

export function reviewClientControlDraft(
  workspaceId: string,
  messageId: string,
  payload: {
    decision: ClientControlReviewDecision;
    editedBody?: string;
    englishMeaning?: string;
    reason?: string;
  }
) {
  return apiFetch<{ ok: boolean; decision: ClientControlReviewDecision; status: string; send_released: false }>(
    '/workspaces/' + workspaceId + '/messaging/client-control/drafts/' + messageId + '/review',
    { method: 'POST', body: JSON.stringify(payload) }
  );
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

export interface MetaConnectionStatus {
  appCredentials: { configured: boolean };
  webhookVerifyToken: { configured: boolean };
  transport: { enabled: boolean; pinnedWorkspace: string | null };
  connections: Array<{
    provider: string;
    status: string;
    tokenPresent: boolean;
    expiresAt: string | null;
    expired: boolean;
  }>;
  channels: Array<{
    provider: string;
    status: string;
    externalAccountIdPresent: boolean;
  }>;
}

export interface ConnectMetaChannelInput {
  provider: 'instagram' | 'facebook';
  displayName: string;
  externalAccountId: string;
  accessToken: string;
  accessExpiresAt: string;
  scopes?: string;
}

export function getMetaConnectionStatus(workspaceId: string) {
  return apiFetch<MetaConnectionStatus>('/workspaces/' + workspaceId + '/messaging/meta/status');
}

export function connectMetaChannel(workspaceId: string, input: ConnectMetaChannelInput) {
  return apiFetch<{
    channel: { id: string; provider: string; display_name: string; external_account_id: string; status: string };
    credential: { provider: string; status: string; expiresAt: string; tokenStored: boolean };
    sendingEnabled: boolean;
  }>('/workspaces/' + workspaceId + '/messaging/channels/meta', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function disconnectMetaChannel(workspaceId: string, provider: 'instagram' | 'facebook') {
  return apiFetch<{ provider: string; channelsDisconnected: number; credentialsRevoked: number }>(
    '/workspaces/' + workspaceId + '/messaging/channels/meta/' + provider + '/disconnect',
    { method: 'POST' }
  );
}

export interface LineConnectionStatus {
  channelCredentials: { configured: boolean };
  transport: { enabled: boolean; pinnedWorkspace: string | null };
  connection: {
    provider: string;
    status: string;
    tokenPresent: boolean;
    expiresAt: string | null;
    expired: boolean;
  } | null;
  channel: {
    provider: string;
    status: string;
    externalAccountIdPresent: boolean;
  } | null;
}

export interface ConnectLineChannelInput {
  provider: 'line';
  displayName: string;
  externalAccountId: string;
  accessToken: string;
  accessExpiresAt: string;
  scopes?: string;
}

export function getLineConnectionStatus(workspaceId: string) {
  return apiFetch<LineConnectionStatus>('/workspaces/' + workspaceId + '/messaging/line/status');
}

export function connectLineChannel(workspaceId: string, input: ConnectLineChannelInput) {
  return apiFetch<{
    channel: { id: string; provider: string; display_name: string; external_account_id: string; status: string };
    credential: { provider: string; status: string; expiresAt: string; tokenStored: boolean };
    sendingEnabled: boolean;
  }>('/workspaces/' + workspaceId + '/messaging/channels/line', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function disconnectLineChannel(workspaceId: string) {
  return apiFetch<{ provider: string; channelsDisconnected: number; credentialsRevoked: number }>(
    '/workspaces/' + workspaceId + '/messaging/channels/line/disconnect',
    { method: 'POST' }
  );
}