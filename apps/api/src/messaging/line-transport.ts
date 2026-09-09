import { createServiceSupabaseClient } from '../config/supabase';
import type { MessagingProviderAdapter, MessagingSendInput, MessagingSendResult } from './provider-adapter';

/**
 * Explicit opt-in gate for LINE outbound messaging, same shape as Meta's
 * metaTransportEnabled(). Wiring this adapter into MessagingService must not, by
 * itself, enable a single real send — this must also be true.
 *
 * LINE_TRANSPORT_ENABLED gates all LINE sending globally. When LINE_STAGING_WORKSPACE_ID
 * is also set, only that one workspace may send — that is how the first end-to-end test
 * should run before any wider use.
 */
export function lineTransportEnabled(workspaceId?: string) {
  if (process.env.LINE_TRANSPORT_ENABLED !== 'true') return false;
  const pinned = process.env.LINE_STAGING_WORKSPACE_ID;
  if (pinned && workspaceId && pinned !== workspaceId) return false;
  return true;
}

/**
 * LINE channel credentials are read from the same two tables the Meta transport uses:
 *
 * - integration_apps — one row per provider's channel secret (service_role only, RLS disabled
 *   for anon/authenticated). The LINE channel secret is the shared secret used to verify
 *   webhook signatures on inbound and is also the API credential model LINE uses for server
 *   access; stored here because it is the provider-side shared credential, not a per-workspace
 *   user token. RLS is enabled on this table with no policy for authenticated/anon, so only
 *   this API process (service_role) can ever read it.
 * - oauth_connections — per-workspace LINE access token. Same isolation as Meta: service_role
 *   only, never exposed to a mobile client.
 *
 * The LINE Messaging API uses the channel access token as its Bearer credential. For this
 * build the token comes from oauth_connections (per-workspace), and the channel secret is
 * fetched from integration_apps for diagnostics only (the send path does not need it).
 */
interface LineChannelCredentials {
  channelSecret: string;
  accessToken: string;
}

/**
 * integration_apps holds one row per provider's channel secret (Angel pastes these once,
 * in the Supabase dashboard). RLS is enabled on this table with no policy for
 * authenticated/anon, so only service_role — meaning only this API process — can ever read
 * it; there is no path from a mobile session or PostgREST anon/authenticated key to this
 * data.
 */
export async function loadLineChannelCredentials(): Promise<LineChannelCredentials> {
  const supabase = createServiceSupabaseClient();

  // integration_apps.workspace_id is NOT NULL, but a row is always workspace-tagged.
  // Take the oldest row deterministically — same pattern as Meta.
  const { data, error } = await supabase
    .from('integration_apps')
    .select('client_key, client_secret')
    .eq('provider', 'line')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw new Error(`Could not load LINE channel credentials: ${error.message}`);
  const row = data?.[0];
  if (!row) throw new Error('No LINE channel credentials configured (integration_apps, provider="line").');
  if (!row.client_key?.trim() || !row.client_secret?.trim()) {
    throw new Error('LINE channel credentials row exists but client_key/client_secret is empty.');
  }
  return { channelSecret: row.client_secret, accessToken: row.client_key };
}

/**
 * oauth_connections holds the live per-workspace LINE channel access token. Same isolation
 * as Meta: service_role only, never exposed to a mobile client.
 */
async function loadLineAccessToken(workspaceId: string): Promise<string> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('oauth_connections')
    .select('access_token, status, access_expires_at')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'line')
    .maybeSingle();

  if (error) throw new Error(`Could not load LINE connection: ${error.message}`);
  if (!data) throw new Error('No LINE account is connected for this workspace yet.');
  if (data.status !== 'active') throw new Error(`LINE connection is ${data.status}, not active.`);
  if (data.access_expires_at && new Date(data.access_expires_at).getTime() <= Date.now()) {
    throw new Error(`LINE access token expired at ${data.access_expires_at}. Reconnect the channel.`);
  }
  return data.access_token;
}

/**
 * Diagnostics for the setup checklist: reports what is configured WITHOUT reading or returning
 * any secret value. Safe to log and safe to surface to the owner — same pattern as
 * metaCredentialStatus().
 */
export async function lineCredentialStatus(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const [channel, connections, channels] = await Promise.all([
    supabase.from('integration_apps').select('client_key, client_secret').eq('provider', 'line').limit(1),
    supabase.from('oauth_connections').select('provider, status, access_expires_at, access_token').eq('workspace_id', workspaceId).eq('provider', 'line'),
    supabase.from('messaging_channels').select('provider, status, external_account_id').eq('workspace_id', workspaceId).eq('provider', 'line')
  ]);

  const channelRow = channel.data?.[0];
  return {
    channelCredentials: {
      configured: Boolean(channelRow?.client_key?.trim() && channelRow?.client_secret?.trim())
    },
    transport: { enabled: lineTransportEnabled(workspaceId), pinnedWorkspace: process.env.LINE_STAGING_WORKSPACE_ID ?? null },
    connection: (connections.data ?? [])[0] !== undefined
      ? {
          provider: (connections.data ?? [])[0].provider,
          status: (connections.data ?? [])[0].status,
          tokenPresent: Boolean((connections.data ?? [])[0].access_token?.trim()),
          expiresAt: (connections.data ?? [])[0].access_expires_at,
          expired: Boolean((connections.data ?? [])[0].access_expires_at && new Date((connections.data ?? [])[0].access_expires_at).getTime() <= Date.now())
        }
      : null,
    channel: (channels.data ?? [])[0] !== undefined
      ? {
          provider: (channels.data ?? [])[0].provider,
          status: (channels.data ?? [])[0].status,
          externalAccountIdPresent: Boolean((channels.data ?? [])[0].external_account_id?.trim())
        }
      : null
  };
}

const LINE_API_VERSION = 'v20240524';
const LINE_TIMEOUT_MS = 15_000;

/**
 * Sends a reply via the LINE Messaging API. The recipient is the LINE user ID (the
 * external_user_id stored on the thread's channel identity), and the channel access token
 * comes from oauth_connections for the workspace/provider.
 *
 * This is the only place in the codebase that makes a real HTTP call to LINE, and it is
 * dormant unless lineTransportEnabled(workspaceId) is true.
 *
 * LINE user IDs vary by source: for LINE Official Account / LINE Login they are the
 * userId field from the webhook payload; for LINE Things and other sources the format
 * differs. The adapter treats the recipient ID as opaque — it is whatever external_user_id
 * was stored when the inbound message was ingested (from the LINE webhook or from n8n).
 */
export class LineMessagingAdapter implements MessagingProviderAdapter {
  async send(input: MessagingSendInput): Promise<MessagingSendResult> {
    const { workspaceId, externalAccountId, body } = input;

    if (!workspaceId) {
      return { status: 'failed', error: 'LINE adapter requires workspaceId' };
    }
    if (!externalAccountId) {
      return { status: 'failed', error: 'LINE adapter requires the LINE user id (externalAccountId)' };
    }
    if (!body || body.trim().length === 0) {
      return { status: 'failed', error: 'LINE adapter requires a non-empty message body' };
    }
    if (!lineTransportEnabled(workspaceId)) {
      return { status: 'failed', error: 'LINE transport is not enabled for this workspace' };
    }

    let accessToken: string;
    try {
      accessToken = await loadLineAccessToken(workspaceId);
    } catch (error) {
      return { status: 'failed', error: error instanceof Error ? error.message : 'LINE credential load failed' };
    }

    // LINE messages must be ≤ 5000 characters for text messages.
    const text = body.trim();
    if (text.length > 5000) {
      return { status: 'failed', error: `LINE message body exceeds the 5000-character limit (${text.length} chars)` };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LINE_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.line.me/v2/bot/message/push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            to: externalAccountId,
            messages: [{ type: 'text', text }]
          }),
          signal: controller.signal
        }
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        // A clear rejection from LINE (invalid token, blocked user, etc.) is a definite
        // failure, not an uncertain one.
        return {
          status: 'failed',
          error: payload?.error?.message || `LINE API error (HTTP ${response.status})`,
          raw: payload ?? undefined
        };
      }

      // LINE returns 200 with an empty JSON object on success — no message id in the response.
      // We record the request as sent and let the caller's idempotency key be the evidence
      // key. The send attempt table is the durable delivery record.
      if (response.status === 200) {
        return { status: 'sent', raw: payload ?? {} };
      }

      return { status: 'unknown', error: `LINE returned unexpected status ${response.status}`, raw: payload ?? undefined };
    } catch (error) {
      // Network failure, timeout, or abort: whether LINE received and sent the message before
      // the connection dropped is unknowable from here. Never guess "sent".
      return { status: 'unknown', error: error instanceof Error ? error.message : 'LINE request failed' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
