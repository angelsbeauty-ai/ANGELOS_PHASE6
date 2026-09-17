"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_service_1 = require("../ai/ai-provider.service");
const supabase_1 = require("../config/supabase");
const provider_adapter_1 = require("./provider-adapter");
const staging_message_execution_service_1 = require("./staging-message-execution.service");
const meta_transport_1 = require("./meta-transport");
const line_transport_1 = require("./line-transport");
const SENSITIVE_PATTERNS = [/complain/i, /refund/i, /unhappy/i, /angry/i, /legal/i, /wrong/i, /scam/i, /emergency/i];
let MessagingService = class MessagingService {
    aiProvider;
    stagingExecution;
    manualAdapter = new provider_adapter_1.ManualDemoMessagingAdapter();
    constructor(aiProvider, stagingExecution) {
        this.aiProvider = aiProvider;
        this.stagingExecution = stagingExecution;
    }
    async getWorkspaceMembership(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('workspace_memberships')
            .select('workspace_id,role')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Workspace not found');
        return data;
    }
    async getClientControlDraft(user, workspaceId, messageId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('client_messages')
            .select('id,thread_id,metadata')
            .eq('workspace_id', workspaceId)
            .eq('id', messageId)
            .eq('direction', 'outbound')
            .maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data || data.metadata?.stage !== 'line_client_control_staging') {
            throw new common_1.NotFoundException('Client Control draft not found');
        }
        return data;
    }
    async getClientControlReviewQueue(user, workspaceId) {
        await this.getWorkspaceMembership(user, workspaceId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('get_client_control_review_queue', {
            p_workspace_id: workspaceId,
            p_limit: 50
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? { ok: true, items: [] };
    }
    async getClientControlContext(user, workspaceId, threadId) {
        await this.getThread(user, workspaceId, threadId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('get_client_control_context', { p_thread_id: threadId });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data?.ok)
            throw new common_1.NotFoundException('Client Control context not found');
        return data;
    }
    async getClientControlReviewDetail(user, workspaceId, messageId) {
        await this.getWorkspaceMembership(user, workspaceId);
        await this.getClientControlDraft(user, workspaceId, messageId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('get_client_control_review_detail', {
            p_workspace_id: workspaceId,
            p_draft_message_id: messageId
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data?.ok)
            throw new common_1.NotFoundException('Client Control draft not found');
        return data;
    }
    async reviewClientControlDraft(user, workspaceId, messageId, dto) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner') {
            throw new common_1.ForbiddenException('Only the workspace owner can review client-control drafts.');
        }
        await this.getClientControlDraft(user, workspaceId, messageId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('review_client_control_draft', {
            p_message_id: messageId,
            p_decision: dto.decision,
            p_edited_body: dto.editedBody?.trim() || null,
            p_english_meaning: dto.englishMeaning?.trim() || null,
            p_reason: dto.reason?.trim() || null,
            p_actor_user_id: user.id,
            p_actor_type: 'angel'
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data?.ok)
            throw new common_1.BadRequestException(data?.reason ?? 'Client Control review was not accepted');
        return data;
    }
    async stageClientControlDraft(user, workspaceId, threadId) {
        await this.getWorkspaceMembership(user, workspaceId);
        const detail = await this.getThread(user, workspaceId, threadId);
        const thread = detail.thread;
        if (thread.channel?.provider !== 'line') {
            throw new common_1.BadRequestException('Client Control staging currently covers LINE threads only.');
        }
        const latestInbound = [...detail.messages].reverse().find((item) => item.direction === 'inbound');
        if (!latestInbound)
            throw new common_1.BadRequestException('No inbound message to analyse');
        const client = thread.client;
        const response = await this.aiProvider.generate({
            instructions: [
                'You are the AngelOS assistant preparing a LINE reply for the business owner to review.',
                'Return ONLY a JSON object, no prose and no code fences, with exactly these keys:',
                '"reply" (the suggested reply, in the client\'s language),',
                '"english_meaning" (what your reply says, in English),',
                '"client_message_english_meaning" (what the CLIENT said, in English),',
                '"detected_language" (one of "ja","en","mixed","unknown"),',
                '"translation_method" (how you translated, e.g. "model"),',
                '"intent","urgency","sentiment","treatment_or_topic" (short strings),',
                '"requested_date_time" (string or null),',
                '"risk_flags" (array of strings, may be empty),',
                '"sensitive" (boolean),',
                '"recommended_next_action" (short string).',
                'Never invent price, availability, policy, or medical facts. If the language is unclear use "unknown".',
                client ? `Known client: ${client.display_name}; language=${client.language}.` : 'Sender is not linked to a verified client record.'
            ].join(' '),
            input: latestInbound.body
        });
        let parsed;
        try {
            parsed = JSON.parse(response.text.trim().replace(/^```(?:json)?|```$/g, '').trim());
        }
        catch {
            throw new common_1.BadGatewayException('The assistant did not return a usable analysis for this message.');
        }
        const analysis = {
            ...parsed,
            needs_angel: true,
            send_released: false
        };
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('save_client_control_draft', {
            p_thread_id: threadId,
            p_source_message_id: latestInbound.id,
            p_body: String(parsed.reply ?? '').trim(),
            p_english_meaning: String(parsed.english_meaning ?? '').trim(),
            p_analysis: analysis,
            p_draft_key: latestInbound.id
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data?.ok)
            throw new common_1.BadRequestException(data?.reason ?? 'Client Control draft was not accepted');
        return data;
    }
    async listChannels(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('messaging_channels').select('*').eq('workspace_id', workspaceId).order('created_at');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async createDemoChannel(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('messaging_channels').insert({
            workspace_id: workspaceId,
            provider: 'manual',
            display_name: dto.displayName?.trim() || 'AngelOS Demo Inbox',
            status: 'connected',
            capabilities: { inbound: true, outbound: true, demo: true },
            created_by: user.id
        }).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data;
    }
    async connectMetaChannel(user, workspaceId, dto) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can connect a messaging account.');
        if (new Date(dto.accessExpiresAt).getTime() <= Date.now()) {
            throw new common_1.BadRequestException('That access token is already expired. Generate a fresh long-lived token first.');
        }
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const externalAccountId = dto.externalAccountId.trim();
        const { data: clash, error: clashError } = await service
            .from('messaging_channels')
            .select('id,workspace_id')
            .eq('provider', dto.provider)
            .eq('external_account_id', externalAccountId)
            .maybeSingle();
        if (clashError)
            throw new common_1.InternalServerErrorException(clashError.message);
        if (clash && clash.workspace_id !== workspaceId) {
            throw new common_1.ConflictException('That account is already connected to a different workspace.');
        }
        const now = new Date().toISOString();
        const channelPayload = {
            workspace_id: workspaceId,
            provider: dto.provider,
            display_name: dto.displayName.trim(),
            external_account_id: externalAccountId,
            status: 'connected',
            capabilities: { inbound: true, outbound: true },
            updated_at: now
        };
        const channel = clash
            ? await service.from('messaging_channels').update(channelPayload).eq('id', clash.id).select('id,provider,display_name,external_account_id,status').single()
            : await service.from('messaging_channels').insert({ ...channelPayload, created_by: user.id }).select('id,provider,display_name,external_account_id,status').single();
        if (channel.error)
            throw new common_1.InternalServerErrorException(channel.error.message);
        const { data: existing, error: existingError } = await service
            .from('oauth_connections')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('provider', dto.provider)
            .maybeSingle();
        if (existingError)
            throw new common_1.InternalServerErrorException(existingError.message);
        const credential = {
            workspace_id: workspaceId,
            provider: dto.provider,
            access_token: dto.accessToken,
            access_expires_at: dto.accessExpiresAt,
            scopes: dto.scopes?.trim() || null,
            open_id: externalAccountId,
            status: 'active',
            last_error: null,
            updated_at: now
        };
        const saved = existing
            ? await service.from('oauth_connections').update(credential).eq('id', existing.id)
            : await service.from('oauth_connections').insert(credential);
        if (saved.error)
            throw new common_1.InternalServerErrorException(saved.error.message);
        return {
            channel: channel.data,
            credential: { provider: dto.provider, status: 'active', expiresAt: dto.accessExpiresAt, tokenStored: true },
            sendingEnabled: (0, meta_transport_1.metaTransportEnabled)(workspaceId)
        };
    }
    async disconnectMetaChannel(user, workspaceId, provider) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can disconnect a messaging account.');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date().toISOString();
        const channel = await service.from('messaging_channels').update({ status: 'disconnected', updated_at: now }).eq('workspace_id', workspaceId).eq('provider', provider).select('id');
        if (channel.error)
            throw new common_1.InternalServerErrorException(channel.error.message);
        const credential = await service.from('oauth_connections').update({ status: 'revoked', access_token: '', updated_at: now }).eq('workspace_id', workspaceId).eq('provider', provider).select('id');
        if (credential.error)
            throw new common_1.InternalServerErrorException(credential.error.message);
        return { provider, channelsDisconnected: channel.data?.length ?? 0, credentialsRevoked: credential.data?.length ?? 0 };
    }
    async connectLineChannel(user, workspaceId, dto) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can connect a messaging account.');
        if (new Date(dto.accessExpiresAt).getTime() <= Date.now()) {
            throw new common_1.BadRequestException('That access token is already expired. Generate a fresh channel access token first.');
        }
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const externalAccountId = dto.externalAccountId.trim();
        const { data: clash, error: clashError } = await service
            .from('messaging_channels')
            .select('id, workspace_id')
            .eq('provider', 'line')
            .eq('external_account_id', externalAccountId)
            .maybeSingle();
        if (clashError)
            throw new common_1.InternalServerErrorException(clashError.message);
        if (clash && clash.workspace_id !== workspaceId) {
            throw new common_1.ConflictException('That LINE account is already connected to a different workspace.');
        }
        const now = new Date().toISOString();
        const channelPayload = {
            workspace_id: workspaceId,
            provider: 'line',
            display_name: dto.displayName.trim(),
            external_account_id: externalAccountId,
            status: 'connected',
            capabilities: { inbound: true, outbound: true },
            updated_at: now
        };
        const channel = clash
            ? await service.from('messaging_channels').update(channelPayload).eq('id', clash.id).select('id, provider, display_name, external_account_id, status').single()
            : await service.from('messaging_channels').insert({ ...channelPayload, created_by: user.id }).select('id, provider, display_name, external_account_id, status').single();
        if (channel.error)
            throw new common_1.InternalServerErrorException(channel.error.message);
        const { data: existing, error: existingError } = await service
            .from('oauth_connections')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('provider', 'line')
            .maybeSingle();
        if (existingError)
            throw new common_1.InternalServerErrorException(existingError.message);
        const credential = {
            workspace_id: workspaceId,
            provider: 'line',
            access_token: dto.accessToken,
            access_expires_at: dto.accessExpiresAt,
            scopes: dto.scopes?.trim() || null,
            open_id: externalAccountId,
            status: 'active',
            last_error: null,
            updated_at: now
        };
        const saved = existing
            ? await service.from('oauth_connections').update(credential).eq('id', existing.id)
            : await service.from('oauth_connections').insert(credential);
        if (saved.error)
            throw new common_1.InternalServerErrorException(saved.error.message);
        return {
            channel: channel.data,
            credential: { provider: 'line', status: 'active', expiresAt: dto.accessExpiresAt, tokenStored: true },
            sendingEnabled: (0, line_transport_1.lineTransportEnabled)(workspaceId)
        };
    }
    async disconnectLineChannel(user, workspaceId) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can disconnect a messaging account.');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date().toISOString();
        const channel = await service.from('messaging_channels').update({ status: 'disconnected', updated_at: now }).eq('workspace_id', workspaceId).eq('provider', 'line').select('id');
        if (channel.error)
            throw new common_1.InternalServerErrorException(channel.error.message);
        const credential = await service.from('oauth_connections').update({ status: 'revoked', access_token: '', updated_at: now }).eq('workspace_id', workspaceId).eq('provider', 'line').select('id');
        if (credential.error)
            throw new common_1.InternalServerErrorException(credential.error.message);
        return { provider: 'line', channelsDisconnected: channel.data?.length ?? 0, credentialsRevoked: credential.data?.length ?? 0 };
    }
    async getLineSetupStatus(user, workspaceId) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can view integration status.');
        return (0, line_transport_1.lineCredentialStatus)(workspaceId);
    }
    async listThreads(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('message_threads')
            .select('*,channel:messaging_channels(id,provider,display_name,status),client:clients(id,display_name,language,do_not_auto_message)')
            .eq('workspace_id', workspaceId)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(100);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async getThread(user, workspaceId, threadId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: thread, error: threadError } = await supabase
            .from('message_threads')
            .select('*,channel:messaging_channels(*),client:clients(id,display_name,language,status,do_not_auto_message)')
            .eq('workspace_id', workspaceId).eq('id', threadId).single();
        if (threadError || !thread)
            throw new common_1.NotFoundException('Message thread not found');
        const [messages, notes] = await Promise.all([
            supabase.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('thread_id', threadId).order('created_at'),
            supabase.from('message_internal_notes').select('*').eq('workspace_id', workspaceId).eq('thread_id', threadId).order('created_at', { ascending: false })
        ]);
        if (messages.error)
            throw new common_1.InternalServerErrorException(messages.error.message);
        if (notes.error)
            throw new common_1.InternalServerErrorException(notes.error.message);
        return { thread, messages: messages.data ?? [], internalNotes: notes.data ?? [] };
    }
    async ingestDemoMessage(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: channel, error: channelError } = await supabase.from('messaging_channels').select('*').eq('workspace_id', workspaceId).eq('id', dto.channelId).single();
        if (channelError || !channel)
            throw new common_1.NotFoundException('Messaging channel not found');
        if (channel.provider !== 'manual')
            throw new common_1.BadRequestException('Manual ingest is only available for the demo transport. Live providers use verified webhooks.');
        if (channel.status !== 'connected')
            throw new common_1.ConflictException('Messaging channel is not connected.');
        if (!dto.body.trim())
            throw new common_1.BadRequestException('Message body is required');
        if (dto.externalMessageId?.trim()) {
            const prior = await supabase.from('client_messages').select('id').eq('workspace_id', workspaceId).eq('external_message_id', dto.externalMessageId.trim()).maybeSingle();
            if (prior.error)
                throw new common_1.InternalServerErrorException(prior.error.message);
            if (prior.data)
                throw new common_1.ConflictException('That inbound message was already ingested.');
        }
        let clientId = dto.clientId ?? null;
        if (clientId) {
            const client = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', clientId).maybeSingle();
            if (client.error)
                throw new common_1.InternalServerErrorException(client.error.message);
            if (!client.data)
                throw new common_1.NotFoundException('Client not found');
        }
        {
            const { data: identity, error: identityError } = await supabase.from('client_channel_identities').select('client_id').eq('workspace_id', workspaceId).eq('channel_id', dto.channelId).eq('external_user_id', dto.externalUserId).maybeSingle();
            if (identityError)
                throw new common_1.InternalServerErrorException(identityError.message);
            if (clientId && identity && identity.client_id !== clientId)
                throw new common_1.ConflictException('Channel identity is already linked to a different client');
            clientId = clientId ?? identity?.client_id ?? null;
        }
        if (!clientId) {
            const leadName = dto.contactDisplayName?.trim() || `${channel.display_name} lead`;
            const { data: lead, error: leadError } = await supabase.from('clients').insert({
                workspace_id: workspaceId, display_name: leadName, language: dto.language ?? 'en', status: 'lead',
                source: channel.provider, do_not_auto_message: false, created_by: user.id
            }).select('id').single();
            if (leadError || !lead)
                throw new common_1.InternalServerErrorException(leadError?.message ?? 'Could not create lead');
            clientId = lead.id;
        }
        const intent = classifyIntent(dto.body);
        const sensitive = isSensitive(dto.body, intent);
        const phishing = looksLikePhishing(dto.body);
        const priority = sensitive || phishing || /arrived|can't find|cannot find|lost/i.test(dto.body) ? 'urgent' : 'today';
        const status = phishing ? 'spam_scam' : sensitive ? 'needs_owner' : intent === 'booking' || intent === 'reschedule' ? 'booking_in_progress' : 'needs_reply';
        const { data: existingThread, error: threadLookupError } = await supabase.from('message_threads').select('id,client_id,contact_external_user_id').eq('workspace_id', workspaceId).eq('channel_id', dto.channelId).eq('external_thread_id', dto.externalThreadId).maybeSingle();
        if (threadLookupError)
            throw new common_1.InternalServerErrorException(threadLookupError.message);
        if (existingThread && (existingThread.client_id !== clientId || existingThread.contact_external_user_id !== dto.externalUserId))
            throw new common_1.ConflictException('Thread identity does not match this client');
        let threadId = existingThread?.id;
        if (!threadId) {
            const created = await supabase.from('message_threads').insert({
                workspace_id: workspaceId, channel_id: dto.channelId, client_id: clientId,
                external_thread_id: dto.externalThreadId, contact_external_user_id: dto.externalUserId,
                contact_display_name: dto.contactDisplayName?.trim() || null, intent, priority, status,
                needs_owner: sensitive || phishing, last_message_at: new Date().toISOString()
            }).select('id').single();
            if (created.error || !created.data)
                throw new common_1.InternalServerErrorException(created.error?.message ?? 'Could not create message thread');
            threadId = created.data.id;
        }
        else {
            const { error } = await supabase.from('message_threads').update({
                client_id: clientId, contact_display_name: dto.contactDisplayName?.trim() || undefined,
                intent, priority, status, needs_owner: sensitive || phishing, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }).eq('workspace_id', workspaceId).eq('id', threadId);
            if (error)
                throw new common_1.InternalServerErrorException(error.message);
        }
        const externalMessageId = dto.externalMessageId?.trim() || `demo_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: message, error: messageError } = await service.from('client_messages').insert({
            workspace_id: workspaceId, thread_id: threadId, client_id: clientId,
            direction: 'inbound', sender_type: 'client', external_message_id: externalMessageId,
            body: dto.body.trim(), original_language: dto.language ?? null, status: 'received', sensitive,
            metadata: { source: 'manual-demo' }
        }).select('*').single();
        if (messageError) {
            if (messageError.code === '23505')
                throw new common_1.ConflictException('That inbound message was already ingested.');
            throw new common_1.InternalServerErrorException(messageError.message);
        }
        const { error: identityUpsertError } = await supabase.from('client_channel_identities').upsert({
            workspace_id: workspaceId, client_id: clientId, channel_id: dto.channelId,
            external_user_id: dto.externalUserId, display_name: dto.contactDisplayName?.trim() || null,
            match_confidence: dto.matchConfidence ?? 'verified'
        }, { onConflict: 'workspace_id,channel_id,external_user_id' });
        if (identityUpsertError)
            throw new common_1.InternalServerErrorException(identityUpsertError.message);
        return { threadId, message, intent, sensitive, phishing, priority, clientId };
    }
    async draftReply(user, workspaceId, threadId) {
        const detail = await this.getThread(user, workspaceId, threadId);
        const latestInbound = [...detail.messages].reverse().find((item) => item.direction === 'inbound');
        if (!latestInbound)
            throw new common_1.BadRequestException('No inbound message to reply to');
        const client = detail.thread.client;
        const thread = detail.thread;
        const businessContext = client
            ? `Known client: ${client.display_name}; language=${client.language}; doNotAutoMessage=${client.do_not_auto_message}.`
            : 'Sender is not yet linked to a verified client record.';
        const instructions = `You are the AngelOS AI receptionist. Draft ONE concise client-facing reply. Be warm, natural, professional, and easy to understand. Never invent price, availability, policies, medical facts, or private arrival details. If a booking/availability question needs calendar confirmation, say you are checking or ask the owner to choose a slot; do not promise a time. If the message is a complaint, refund issue, emotional, sensitive, or identity-uncertain, prepare a careful draft but mark it as needing owner review. Reply in the client's apparent language when clear. ${businessContext} Thread intent=${thread.intent}.`;
        const response = await this.aiProvider.generate({ instructions, input: `Client: ${latestInbound.body}` });
        const sensitive = Boolean(latestInbound.sensitive) || thread.intent === 'complaint' || !client;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        if ((0, staging_message_execution_service_1.flow1StagingEnabled)(workspaceId) && this.stagingExecution) {
            const approval = await this.stagingExecution.prepare(user, workspaceId, latestInbound.id, response.text, client?.id, thread.channel.provider);
            const saved = await service.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('id', approval.context.outbound_message_id).single();
            if (saved.error)
                throw new common_1.InternalServerErrorException(saved.error.message);
            return { message: saved.data, approval, requiresApproval: true, reason: 'Staging reply requires owner approval.' };
        }
        const { data, error } = await service.from('client_messages').insert({
            workspace_id: workspaceId, thread_id: threadId, client_id: client?.id ?? null,
            direction: 'outbound', sender_type: 'ai', body: response.text,
            status: 'pending_approval', sensitive,
            metadata: { provider: response.provider, model: response.model, draft_reason: 'ai_receptionist' },
            created_by: user.id
        }).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: data, requiresApproval: true, reason: sensitive ? 'Sensitive or unverified context requires owner review.' : 'Guided autonomy requires approval for conversational replies in Sprint 5.' };
    }
    async createReply(user, workspaceId, threadId, dto) {
        if (!dto.body.trim())
            throw new common_1.BadRequestException('Message body is required');
        const detail = await this.getThread(user, workspaceId, threadId);
        const client = detail.thread.client;
        const sensitive = isSensitive(dto.body, detail.thread.intent);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('client_messages').insert({
            workspace_id: workspaceId, thread_id: threadId, client_id: client?.id ?? null,
            direction: 'outbound', sender_type: 'owner', body: dto.body.trim(),
            status: dto.sendNow ? 'queued' : 'draft', sensitive,
            routine_category: dto.routineCategory ?? null, created_by: user.id
        }).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!dto.sendNow)
            return { message: data, sent: false };
        return this.sendMessage(user, workspaceId, data.id, true);
    }
    async approveAndSend(user, workspaceId, messageId) {
        return this.sendMessage(user, workspaceId, messageId, true);
    }
    async translateMessage(user, workspaceId, messageId, targetLanguage) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: message, error } = await supabase.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('id', messageId).single();
        if (error || !message)
            throw new common_1.NotFoundException('Message not found');
        const response = await this.aiProvider.generate({
            instructions: `Translate the message naturally into ${targetLanguage}. Preserve meaning, names, numbers, prices, dates, and uncertainty. Return only the translation.`,
            input: message.body
        });
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: updated, error: updateError } = await service.from('client_messages').update({ translated_body: response.text, metadata: { ...(message.metadata ?? {}), translation_target: targetLanguage, translation_provider: response.provider } }).eq('workspace_id', workspaceId).eq('id', messageId).select('*').single();
        if (updateError)
            throw new common_1.InternalServerErrorException(updateError.message);
        return updated;
    }
    async addInternalNote(user, workspaceId, threadId, content) {
        await this.getThread(user, workspaceId, threadId);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('message_internal_notes').insert({ workspace_id: workspaceId, thread_id: threadId, content: content.trim(), created_by: user.id }).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data;
    }
    async updateThread(user, workspaceId, threadId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const updates = { updated_at: new Date().toISOString() };
        if (dto.status !== undefined)
            updates.status = dto.status;
        if (dto.priority !== undefined)
            updates.priority = dto.priority;
        if (dto.needsOwner !== undefined)
            updates.needs_owner = dto.needsOwner;
        const { data, error } = await supabase.from('message_threads').update(updates).eq('workspace_id', workspaceId).eq('id', threadId).select('*').single();
        if (error || !data)
            throw new common_1.NotFoundException('Message thread not found');
        return data;
    }
    async sendMessage(user, workspaceId, messageId, explicitOwnerApproval = false) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: message, error: messageError } = await supabase.from('client_messages').select('*,thread:message_threads(*,channel:messaging_channels(*),client:clients(id,display_name,do_not_auto_message))').eq('workspace_id', workspaceId).eq('id', messageId).single();
        if (messageError || !message)
            throw new common_1.NotFoundException('Outbound message not found');
        if (message.direction !== 'outbound')
            throw new common_1.BadRequestException('Only outbound messages can be sent');
        if (message.status === 'sent')
            return { message, sent: true, duplicatePrevented: true };
        const thread = message.thread;
        if (!thread?.channel)
            throw new common_1.NotFoundException('Messaging channel not found');
        if (thread.channel.capabilities?.flow1_test === true)
            throw new common_1.ConflictException('Synthetic Flow 1 messages must use approval execution');
        if (!explicitOwnerApproval && thread.client?.do_not_auto_message && message.sender_type === 'ai')
            throw new common_1.ConflictException('Client is marked Do Not Auto-Message.');
        if (!explicitOwnerApproval && message.sensitive && message.sender_type === 'ai')
            throw new common_1.ConflictException('Sensitive AI draft requires owner approval before sending.');
        if (thread.channel.status !== 'connected')
            throw new common_1.ConflictException('Messaging channel is not connected.');
        if (!['draft', 'pending_approval', 'queued', 'failed'].includes(message.status))
            throw new common_1.ConflictException('Message is not in a sendable state.');
        const adapter = this.resolveAdapter(thread.channel.provider);
        if (!adapter)
            throw new common_1.ConflictException('Live provider transport is not connected yet. This Sprint 5 build safely stops instead of pretending the message was sent.');
        const idempotencyKey = `message:${message.id}`;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: existing, error: existingError } = await service.from('message_send_attempts').select('*').eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle();
        if (existingError)
            throw new common_1.InternalServerErrorException(existingError.message);
        if (existing && existing.status !== 'sent')
            throw new common_1.ConflictException('Delivery is already claimed or uncertain. Review the attempt before retrying.');
        if (existing?.status === 'sent') {
            const { data: refreshed } = await supabase.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('id', message.id).single();
            return { message: refreshed, sent: true, duplicatePrevented: true };
        }
        const queued = await service.from('message_send_attempts').insert({ workspace_id: workspaceId, message_id: message.id, channel_id: thread.channel.id, idempotency_key: idempotencyKey, attempt_no: 1, status: 'queued' });
        if (queued.error) {
            if (queued.error.code === '23505')
                throw new common_1.ConflictException('Delivery is already claimed.');
            throw new common_1.InternalServerErrorException(queued.error.message);
        }
        const result = await adapter.send({
            externalThreadId: thread.external_thread_id,
            body: message.body,
            idempotencyKey,
            workspaceId,
            provider: thread.channel.provider,
            externalAccountId: thread.channel.external_account_id
        });
        const { error: attemptError } = await service.from('message_send_attempts').update({
            status: result.status, provider_response: result.raw ?? null, error_message: result.error ?? null,
            finished_at: new Date().toISOString()
        }).eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey);
        if (attemptError)
            throw new common_1.InternalServerErrorException(attemptError.message);
        if (result.status !== 'sent') {
            await service.from('client_messages').update({ status: 'failed' }).eq('workspace_id', workspaceId).eq('id', message.id);
            throw new common_1.InternalServerErrorException(result.error ?? 'Message delivery could not be verified');
        }
        const sentAt = new Date().toISOString();
        const { data: sentMessage, error: updateError } = await service.from('client_messages').update({ status: 'sent', external_message_id: result.externalMessageId, sent_at: sentAt }).eq('workspace_id', workspaceId).eq('id', message.id).select('*').single();
        if (updateError)
            throw new common_1.InternalServerErrorException(updateError.message);
        await service.from('message_threads').update({ status: 'waiting_client', needs_owner: false, last_message_at: sentAt, updated_at: sentAt }).eq('workspace_id', workspaceId).eq('id', thread.id);
        return { message: sentMessage, sent: true, duplicatePrevented: false };
    }
    async getMetaSetupStatus(user, workspaceId) {
        const membership = await this.getWorkspaceMembership(user, workspaceId);
        if (membership.role !== 'owner')
            throw new common_1.ForbiddenException('Only the workspace owner can view integration status.');
        return (0, meta_transport_1.metaCredentialStatus)(workspaceId);
    }
    resolveAdapter(provider) {
        if (provider === 'manual')
            return this.manualAdapter;
        if (provider === 'line' && (0, line_transport_1.lineTransportEnabled)())
            return new line_transport_1.LineMessagingAdapter();
        if ((provider === 'instagram' || provider === 'facebook') && (0, meta_transport_1.metaTransportEnabled)())
            return new meta_transport_1.MetaMessagingAdapter();
        return null;
    }
    async ingestMetaMessage(workspaceId, channelId, externalUserId, externalMessageId, body) {
        const trimmed = body.trim();
        if (!trimmed)
            return { deduplicated: false, skipped: true };
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const prior = await service.from('client_messages').select('id').eq('workspace_id', workspaceId).eq('external_message_id', externalMessageId).maybeSingle();
        if (prior.error)
            throw new common_1.InternalServerErrorException(prior.error.message);
        if (prior.data)
            return { deduplicated: true };
        const { data: identity, error: identityError } = await service
            .from('client_channel_identities')
            .select('client_id')
            .eq('workspace_id', workspaceId)
            .eq('channel_id', channelId)
            .eq('external_user_id', externalUserId)
            .maybeSingle();
        if (identityError)
            throw new common_1.InternalServerErrorException(identityError.message);
        let clientId = identity?.client_id ?? null;
        if (!clientId) {
            const { data: channel, error: channelError } = await service.from('messaging_channels').select('provider,display_name').eq('id', channelId).single();
            if (channelError || !channel)
                throw new common_1.InternalServerErrorException('Messaging channel not found for inbound webhook');
            const { data: lead, error: leadError } = await service.from('clients').insert({
                workspace_id: workspaceId, display_name: `${channel.display_name} lead`, language: 'en', status: 'lead',
                source: channel.provider, do_not_auto_message: false
            }).select('id').single();
            if (leadError || !lead)
                throw new common_1.InternalServerErrorException(leadError?.message ?? 'Could not create lead');
            clientId = lead.id;
            const { error: identityUpsertError } = await service.from('client_channel_identities').upsert({
                workspace_id: workspaceId, client_id: clientId, channel_id: channelId, external_user_id: externalUserId, match_confidence: 'verified'
            }, { onConflict: 'workspace_id,channel_id,external_user_id' });
            if (identityUpsertError)
                throw new common_1.InternalServerErrorException(identityUpsertError.message);
        }
        const intent = classifyIntent(trimmed);
        const sensitive = isSensitive(trimmed, intent);
        const phishing = looksLikePhishing(trimmed);
        const priority = sensitive || phishing ? 'urgent' : 'today';
        const status = phishing ? 'spam_scam' : sensitive ? 'needs_owner' : intent === 'booking' || intent === 'reschedule' ? 'booking_in_progress' : 'needs_reply';
        const { data: existingThread, error: threadLookupError } = await service.from('message_threads').select('id').eq('workspace_id', workspaceId).eq('channel_id', channelId).eq('external_thread_id', externalUserId).maybeSingle();
        if (threadLookupError)
            throw new common_1.InternalServerErrorException(threadLookupError.message);
        let threadId = existingThread?.id;
        if (!threadId) {
            const created = await service.from('message_threads').insert({
                workspace_id: workspaceId, channel_id: channelId, client_id: clientId,
                external_thread_id: externalUserId, contact_external_user_id: externalUserId,
                intent, priority, status, needs_owner: sensitive || phishing, last_message_at: new Date().toISOString()
            }).select('id').single();
            if (created.error || !created.data)
                throw new common_1.InternalServerErrorException(created.error?.message ?? 'Could not create message thread');
            threadId = created.data.id;
        }
        else {
            const { error } = await service.from('message_threads').update({
                client_id: clientId, intent, priority, status, needs_owner: sensitive || phishing,
                last_message_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }).eq('workspace_id', workspaceId).eq('id', threadId);
            if (error)
                throw new common_1.InternalServerErrorException(error.message);
        }
        const { data: message, error: messageError } = await service.from('client_messages').insert({
            workspace_id: workspaceId, thread_id: threadId, client_id: clientId,
            direction: 'inbound', sender_type: 'client', external_message_id: externalMessageId,
            body: trimmed, status: 'received', sensitive, metadata: { source: 'meta-webhook' }
        }).select('id').single();
        if (messageError) {
            if (messageError.code === '23505')
                return { deduplicated: true };
            throw new common_1.InternalServerErrorException(messageError.message);
        }
        return { deduplicated: false, threadId, messageId: message.id };
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [ai_provider_service_1.AiProviderService, staging_message_execution_service_1.StagingMessageExecutionService])
], MessagingService);
function classifyIntent(text) {
    if (/complain|refund|unhappy|angry|wrong/i.test(text))
        return 'complaint';
    if (/resched|move my|change.*appointment|different time/i.test(text))
        return 'reschedule';
    if (/available|availability|book|appointment|slot|free.*(today|tomorrow|saturday|sunday|monday|tuesday|wednesday|thursday|friday)/i.test(text))
        return 'booking';
    if (/price|cost|how much|¥|yen|\$/i.test(text))
        return 'price';
    if (/where|location|address|parking|find you|arrived/i.test(text))
        return 'location';
    if (/aftercare|healing|wash|care/i.test(text))
        return 'aftercare';
    if (/student|course|training|class/i.test(text))
        return 'student';
    if (/follow.?up|checking in/i.test(text))
        return 'follow_up';
    return 'inquiry';
}
function isSensitive(text, intent) {
    return intent === 'complaint' || SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}
function looksLikePhishing(text) {
    return /(verify|confirm|unlock|suspend).*account/i.test(text) || /(password|one[- ]?time code|otp|gift card|crypto wallet)/i.test(text) || /(click|open).*https?:\/\//i.test(text);
}
//# sourceMappingURL=messaging.service.js.map