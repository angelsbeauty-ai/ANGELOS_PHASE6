import { createServiceSupabaseClient } from '../config/supabase';
import type { MessagingProviderAdapter, MessagingSendInput, MessagingSendResult } from './provider-adapter';

/**
 * Explicit opt-in gate, same shape as Flow 1's staging gate (staging-message-execution.ts).
 * Wiring this adapter into MessagingService must not, by itself, enable a single real send:
 * this must also be true. META_STAGING_WORKSPACE_ID is optional -- when set, only that one
 * workspace may send, which is how the first end-to-end test should run before any wider use.
 */
export function metaTransportEnabled(workspaceId?: string) {
  if (process.env.META_TRANSPORT_ENABLED !== 'true') return false;
  const pinned = process.env.META_STAGING_WORKSPACE_ID;
  if (pinned && workspaceId && pinned !== workspaceId) return false;
  return true;
}

interface MetaAppCredentials {
  appId: string;
  appSecret: string;
}

/**
 * integration_apps holds one row per provider's developer-app credentials (Angel pastes these
 * once, in the Supabase dashboard). RLS is enabled on this table with no policy for
 * authenticated/anon, so only service_role -- meaning only this API process -- can ever read
 * it; there is no path from a mobile session or PostgREST anon/authenticated key to this data.
 */
export async function loadMetaAppCredentials(): Promise<MetaAppCredentials> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('integration_apps')
    .select('client_key,client_secret')
    .eq('provider', 'meta')
    .maybeSingle();
  if (error) throw new Error(`Could not load Meta app credentials: ${error.message}`);
  if (!data) throw new Error('No Meta app credentials configured (integration_apps, provider="meta").');
  return { appId: data.client_key, appSecret: data.client_secret };
}

interface MetaConnection {
  accessToken: string;
}

/**
 * oauth_connections holds the live per-workspace Page/Instagram access token. Same isolation
 * as integration_apps: service_role only, never exposed to a mobile client.
 */
async function loadMetaConnection(workspaceId: string, provider: 'instagram' | 'facebook'): Promise<MetaConnection> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('oauth_connections')
    .select('access_token,status,access_expires_at')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw new Error(`Could not load ${provider} connection: ${error.message}`);
  if (!data) throw new Error(`No ${provider} account is connected for this workspace yet.`);
  if (data.status !== 'active') throw new Error(`${provider} connection is ${data.status}, not active.`);
  if (data.access_expires_at && new Date(data.access_expires_at).getTime() <= Date.now()) {
    throw new Error(`${provider} access token expired at ${data.access_expires_at}. Reconnect the account.`);
  }
  return { accessToken: data.access_token };
}

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_TIMEOUT_MS = 15_000;

/**
 * Sends via the Meta Graph API messaging endpoint. Instagram DMs and Facebook Messenger use
 * the same POST /{node-id}/messages shape; node-id is the connected Page id (Facebook) or the
 * linked Instagram professional account id (Instagram) -- stored as
 * messaging_channels.external_account_id -- and the token comes from the matching
 * oauth_connections row for that workspace/provider.
 *
 * This is the only place in the codebase that makes a real HTTP call to Meta, and it is
 * dormant unless metaTransportEnabled(workspaceId) is true.
 */
export class MetaMessagingAdapter implements MessagingProviderAdapter {
  async send(input: MessagingSendInput): Promise<MessagingSendResult> {
    const { workspaceId, provider, externalAccountId, externalThreadId, body } = input;
    if (!workspaceId || !provider || !externalAccountId) {
      return { status: 'failed', error: 'Meta adapter requires workspaceId, provider and externalAccountId' };
    }
    if (!metaTransportEnabled(workspaceId)) {
      return { status: 'failed', error: 'Meta transport is not enabled for this workspace' };
    }

    let accessToken: string;
    try {
      ({ accessToken } = await loadMetaConnection(workspaceId, provider as 'instagram' | 'facebook'));
    } catch (error) {
      return { status: 'failed', error: error instanceof Error ? error.message : 'Meta credential load failed' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GRAPH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(externalAccountId)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            recipient: { id: externalThreadId },
            message: { text: body },
            messaging_type: 'RESPONSE'
          }),
          signal: controller.signal
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        // A clear rejection from Meta (bad recipient, policy violation, expired token, ...) is a
        // definite failure, not an uncertain one.
        return { status: 'failed', error: payload?.error?.message || `Meta API error (HTTP ${response.status})`, raw: payload ?? undefined };
      }
      if (!payload?.message_id) {
        return { status: 'unknown', error: 'Meta accepted the request but returned no message id', raw: payload ?? undefined };
      }
      return { status: 'sent', externalMessageId: payload.message_id, raw: payload };
    } catch (error) {
      // Network failure, timeout, or abort: whether Meta received and sent the message before
      // the connection dropped is unknowable from here. Never guess "sent".
      return { status: 'unknown', error: error instanceof Error ? error.message : 'Meta request failed' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
