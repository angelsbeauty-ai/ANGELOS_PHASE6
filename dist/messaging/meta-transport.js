"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaMessagingAdapter = void 0;
exports.metaTransportEnabled = metaTransportEnabled;
exports.loadMetaAppCredentials = loadMetaAppCredentials;
exports.metaCredentialStatus = metaCredentialStatus;
const supabase_1 = require("../config/supabase");
function metaTransportEnabled(workspaceId) {
    if (process.env.META_TRANSPORT_ENABLED !== 'true')
        return false;
    const pinned = process.env.META_STAGING_WORKSPACE_ID;
    if (pinned && workspaceId && pinned !== workspaceId)
        return false;
    return true;
}
async function loadMetaAppCredentials() {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const { data, error } = await supabase
        .from('integration_apps')
        .select('client_key,client_secret')
        .eq('provider', 'meta')
        .order('created_at', { ascending: true })
        .limit(1);
    if (error)
        throw new Error(`Could not load Meta app credentials: ${error.message}`);
    const row = data?.[0];
    if (!row)
        throw new Error('No Meta app credentials configured (integration_apps, provider="meta").');
    if (!row.client_key?.trim() || !row.client_secret?.trim()) {
        throw new Error('Meta app credentials row exists but client_key/client_secret is empty.');
    }
    return { appId: row.client_key, appSecret: row.client_secret };
}
async function metaCredentialStatus(workspaceId) {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const [app, connections, channels] = await Promise.all([
        supabase.from('integration_apps').select('client_key,client_secret').eq('provider', 'meta').limit(1),
        supabase.from('oauth_connections').select('provider,status,access_expires_at,access_token').eq('workspace_id', workspaceId).in('provider', ['instagram', 'facebook']),
        supabase.from('messaging_channels').select('provider,status,external_account_id').eq('workspace_id', workspaceId).in('provider', ['instagram', 'facebook'])
    ]);
    const appRow = app.data?.[0];
    return {
        appCredentials: {
            configured: Boolean(appRow?.client_key?.trim() && appRow?.client_secret?.trim())
        },
        webhookVerifyToken: { configured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN?.trim()) },
        transport: { enabled: metaTransportEnabled(workspaceId), pinnedWorkspace: process.env.META_STAGING_WORKSPACE_ID ?? null },
        connections: (connections.data ?? []).map((row) => ({
            provider: row.provider,
            status: row.status,
            tokenPresent: Boolean(row.access_token?.trim()),
            expiresAt: row.access_expires_at,
            expired: Boolean(row.access_expires_at && new Date(row.access_expires_at).getTime() <= Date.now())
        })),
        channels: (channels.data ?? []).map((row) => ({
            provider: row.provider,
            status: row.status,
            externalAccountIdPresent: Boolean(row.external_account_id?.trim())
        }))
    };
}
async function loadMetaConnection(workspaceId, provider) {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const { data, error } = await supabase
        .from('oauth_connections')
        .select('access_token,status,access_expires_at')
        .eq('workspace_id', workspaceId)
        .eq('provider', provider)
        .maybeSingle();
    if (error)
        throw new Error(`Could not load ${provider} connection: ${error.message}`);
    if (!data)
        throw new Error(`No ${provider} account is connected for this workspace yet.`);
    if (data.status !== 'connected')
        throw new Error(`${provider} connection is ${data.status}, not connected.`);
    if (data.access_expires_at && new Date(data.access_expires_at).getTime() <= Date.now()) {
        throw new Error(`${provider} access token expired at ${data.access_expires_at}. Reconnect the account.`);
    }
    return { accessToken: data.access_token };
}
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_TIMEOUT_MS = 15_000;
class MetaMessagingAdapter {
    async send(input) {
        const { workspaceId, provider, externalAccountId, externalThreadId, body } = input;
        if (!workspaceId || !provider || !externalAccountId) {
            return { status: 'failed', error: 'Meta adapter requires workspaceId, provider and externalAccountId' };
        }
        if (!metaTransportEnabled(workspaceId)) {
            return { status: 'failed', error: 'Meta transport is not enabled for this workspace' };
        }
        let accessToken;
        try {
            ({ accessToken } = await loadMetaConnection(workspaceId, provider));
        }
        catch (error) {
            return { status: 'failed', error: error instanceof Error ? error.message : 'Meta credential load failed' };
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GRAPH_TIMEOUT_MS);
        try {
            const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(externalAccountId)}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({
                    recipient: { id: externalThreadId },
                    message: { text: body },
                    messaging_type: 'RESPONSE'
                }),
                signal: controller.signal
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                return { status: 'failed', error: payload?.error?.message || `Meta API error (HTTP ${response.status})`, raw: payload ?? undefined };
            }
            if (!payload?.message_id) {
                return { status: 'unknown', error: 'Meta accepted the request but returned no message id', raw: payload ?? undefined };
            }
            return { status: 'sent', externalMessageId: payload.message_id, raw: payload };
        }
        catch (error) {
            return { status: 'unknown', error: error instanceof Error ? error.message : 'Meta request failed' };
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.MetaMessagingAdapter = MetaMessagingAdapter;
//# sourceMappingURL=meta-transport.js.map