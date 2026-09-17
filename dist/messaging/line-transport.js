"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineMessagingAdapter = void 0;
exports.lineTransportEnabled = lineTransportEnabled;
exports.loadLineChannelCredentials = loadLineChannelCredentials;
exports.lineCredentialStatus = lineCredentialStatus;
const supabase_1 = require("../config/supabase");
function lineTransportEnabled(workspaceId) {
    if (process.env.LINE_TRANSPORT_ENABLED !== 'true')
        return false;
    const pinned = process.env.LINE_STAGING_WORKSPACE_ID;
    if (pinned && workspaceId && pinned !== workspaceId)
        return false;
    return true;
}
async function loadLineChannelCredentials() {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const { data, error } = await supabase
        .from('integration_apps')
        .select('client_key, client_secret')
        .eq('provider', 'line')
        .order('created_at', { ascending: true })
        .limit(1);
    if (error)
        throw new Error(`Could not load LINE channel credentials: ${error.message}`);
    const row = data?.[0];
    if (!row)
        throw new Error('No LINE channel credentials configured (integration_apps, provider="line").');
    if (!row.client_key?.trim() || !row.client_secret?.trim()) {
        throw new Error('LINE channel credentials row exists but client_key/client_secret is empty.');
    }
    return { channelSecret: row.client_secret, accessToken: row.client_key };
}
async function loadLineAccessToken(workspaceId) {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const { data, error } = await supabase
        .from('oauth_connections')
        .select('access_token, status, access_expires_at')
        .eq('workspace_id', workspaceId)
        .eq('provider', 'line')
        .maybeSingle();
    if (error)
        throw new Error(`Could not load LINE connection: ${error.message}`);
    if (!data)
        throw new Error('No LINE account is connected for this workspace yet.');
    if (data.status !== 'active')
        throw new Error(`LINE connection is ${data.status}, not active.`);
    if (data.access_expires_at && new Date(data.access_expires_at).getTime() <= Date.now()) {
        throw new Error(`LINE access token expired at ${data.access_expires_at}. Reconnect the channel.`);
    }
    return data.access_token;
}
async function lineCredentialStatus(workspaceId) {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
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
class LineMessagingAdapter {
    async send(input) {
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
        let accessToken;
        try {
            accessToken = await loadLineAccessToken(workspaceId);
        }
        catch (error) {
            return { status: 'failed', error: error instanceof Error ? error.message : 'LINE credential load failed' };
        }
        const text = body.trim();
        if (text.length > 5000) {
            return { status: 'failed', error: `LINE message body exceeds the 5000-character limit (${text.length} chars)` };
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LINE_TIMEOUT_MS);
        try {
            const response = await fetch(`https://api.line.me/v2/bot/message/push`, {
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
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                return {
                    status: 'failed',
                    error: payload?.error?.message || `LINE API error (HTTP ${response.status})`,
                    raw: payload ?? undefined
                };
            }
            if (response.status === 200) {
                return { status: 'sent', raw: payload ?? {} };
            }
            return { status: 'unknown', error: `LINE returned unexpected status ${response.status}`, raw: payload ?? undefined };
        }
        catch (error) {
            return { status: 'unknown', error: error instanceof Error ? error.message : 'LINE request failed' };
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.LineMessagingAdapter = LineMessagingAdapter;
//# sourceMappingURL=line-transport.js.map