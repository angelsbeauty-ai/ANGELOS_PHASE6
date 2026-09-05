import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from '../ai/ai-provider.service';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { CreateDemoChannelDto } from './dto/create-demo-channel.dto';
import type { IngestMessageDto } from './dto/ingest-message.dto';
import type { CreateReplyDto } from './dto/create-reply.dto';
import type { UpdateThreadDto } from './dto/update-thread.dto';
import type { ReviewClientControlDraftDto } from './dto/review-client-control-draft.dto';
import { ManualDemoMessagingAdapter } from './provider-adapter';

const SENSITIVE_PATTERNS = [/complain/i, /refund/i, /unhappy/i, /angry/i, /legal/i, /wrong/i, /scam/i, /emergency/i];

@Injectable()
export class MessagingService {
  private readonly manualAdapter = new ManualDemoMessagingAdapter();
  constructor(private readonly aiProvider: AiProviderService) {}

  private async getWorkspaceMembership(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('workspace_memberships')
      .select('workspace_id,role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Workspace not found');
    return data;
  }

  private async getClientControlDraft(user: AuthUser, workspaceId: string, messageId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('client_messages')
      .select('id,thread_id,metadata')
      .eq('workspace_id', workspaceId)
      .eq('id', messageId)
      .eq('direction', 'outbound')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data || data.metadata?.stage !== 'line_client_control_staging') {
      throw new NotFoundException('Client Control draft not found');
    }
    return data;
  }

  async getClientControlReviewQueue(user: AuthUser, workspaceId: string) {
    await this.getWorkspaceMembership(user, workspaceId);
    const service = createServiceSupabaseClient();
    const { data, error } = await service.rpc('get_client_control_review_queue', {
      p_workspace_id: workspaceId,
      p_limit: 50
    });
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? { ok: true, items: [] };
  }

  async getClientControlContext(user: AuthUser, workspaceId: string, threadId: string) {
    await this.getThread(user, workspaceId, threadId);
    const service = createServiceSupabaseClient();
    const { data, error } = await service.rpc('get_client_control_context', { p_thread_id: threadId });
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.ok) throw new NotFoundException('Client Control context not found');
    return data;
  }

  async getClientControlReviewDetail(user: AuthUser, workspaceId: string, messageId: string) {
    await this.getWorkspaceMembership(user, workspaceId);
    await this.getClientControlDraft(user, workspaceId, messageId);
    const service = createServiceSupabaseClient();
    const { data, error } = await service.rpc('get_client_control_review_detail', {
      p_workspace_id: workspaceId,
      p_draft_message_id: messageId
    });
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.ok) throw new NotFoundException('Client Control draft not found');
    return data;
  }

  async reviewClientControlDraft(user: AuthUser, workspaceId: string, messageId: string, dto: ReviewClientControlDraftDto) {
    const membership = await this.getWorkspaceMembership(user, workspaceId);
    if (membership.role !== 'owner') {
      throw new ForbiddenException('Only the workspace owner can review client-control drafts.');
    }
    await this.getClientControlDraft(user, workspaceId, messageId);
    const service = createServiceSupabaseClient();
    const { data, error } = await service.rpc('review_client_control_draft', {
      p_message_id: messageId,
      p_decision: dto.decision,
      p_edited_body: dto.editedBody?.trim() || null,
      p_english_meaning: dto.englishMeaning?.trim() || null,
      p_reason: dto.reason?.trim() || null,
      p_actor_user_id: user.id,
      p_actor_type: 'angel'
    });
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.ok) throw new BadRequestException(data?.reason ?? 'Client Control review was not accepted');
    return data;
  }

  async listChannels(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('messaging_channels').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async createDemoChannel(user: AuthUser, workspaceId: string, dto: CreateDemoChannelDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('messaging_channels').insert({
      workspace_id: workspaceId,
      provider: 'manual',
      display_name: dto.displayName?.trim() || 'AngelOS Demo Inbox',
      status: 'connected',
      capabilities: { inbound: true, outbound: true, demo: true },
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async listThreads(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('message_threads')
      .select('*,channel:messaging_channels(id,provider,display_name,status),client:clients(id,display_name,language,do_not_auto_message)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async getThread(user: AuthUser, workspaceId: string, threadId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .select('*,channel:messaging_channels(*),client:clients(id,display_name,language,status,do_not_auto_message)')
      .eq('workspace_id', workspaceId).eq('id', threadId).single();
    if (threadError || !thread) throw new NotFoundException('Message thread not found');
    const [messages, notes] = await Promise.all([
      supabase.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('thread_id', threadId).order('created_at'),
      supabase.from('message_internal_notes').select('*').eq('workspace_id', workspaceId).eq('thread_id', threadId).order('created_at', { ascending: false })
    ]);
    if (messages.error) throw new InternalServerErrorException(messages.error.message);
    if (notes.error) throw new InternalServerErrorException(notes.error.message);
    return { thread, messages: messages.data ?? [], internalNotes: notes.data ?? [] };
  }

  async ingestDemoMessage(user: AuthUser, workspaceId: string, dto: IngestMessageDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: channel, error: channelError } = await supabase.from('messaging_channels').select('*').eq('workspace_id', workspaceId).eq('id', dto.channelId).single();
    if (channelError || !channel) throw new NotFoundException('Messaging channel not found');
    if (channel.provider !== 'manual') throw new BadRequestException('Manual ingest is only available for the demo transport. Live providers use verified webhooks.');

    let clientId = dto.clientId ?? null;
    if (!clientId) {
      const { data: identity, error: identityError } = await supabase.from('client_channel_identities').select('client_id').eq('workspace_id', workspaceId).eq('channel_id', dto.channelId).eq('external_user_id', dto.externalUserId).maybeSingle();
      if (identityError) throw new InternalServerErrorException(identityError.message);
      clientId = identity?.client_id ?? null;
    }
    if (!clientId) {
      // Never merge by similar names. A previously unseen channel identity becomes a new lead.
      const leadName = dto.contactDisplayName?.trim() || `${channel.display_name} lead`;
      const { data: lead, error: leadError } = await supabase.from('clients').insert({
        workspace_id: workspaceId, display_name: leadName, language: dto.language ?? 'en', status: 'lead',
        source: channel.provider, do_not_auto_message: false, created_by: user.id
      }).select('id').single();
      if (leadError || !lead) throw new InternalServerErrorException(leadError?.message ?? 'Could not create lead');
      clientId = lead.id;
    }

    const intent = classifyIntent(dto.body);
    const sensitive = isSensitive(dto.body, intent);
    const phishing = looksLikePhishing(dto.body);
    const priority = sensitive || phishing || /arrived|can't find|cannot find|lost/i.test(dto.body) ? 'urgent' : 'today';
    const status = phishing ? 'spam_scam' : sensitive ? 'needs_owner' : intent === 'booking' || intent === 'reschedule' ? 'booking_in_progress' : 'needs_reply';

    const { data: existingThread } = await supabase.from('message_threads').select('id').eq('workspace_id', workspaceId).eq('channel_id', dto.channelId).eq('external_thread_id', dto.externalThreadId).maybeSingle();
    let threadId = existingThread?.id as string | undefined;
    if (!threadId) {
      const created = await supabase.from('message_threads').insert({
        workspace_id: workspaceId, channel_id: dto.channelId, client_id: clientId,
        external_thread_id: dto.externalThreadId, contact_external_user_id: dto.externalUserId,
        contact_display_name: dto.contactDisplayName?.trim() || null, intent, priority, status,
        needs_owner: sensitive || phishing, last_message_at: new Date().toISOString()
      }).select('id').single();
      if (created.error || !created.data) throw new InternalServerErrorException(created.error?.message ?? 'Could not create message thread');
      threadId = created.data.id;
    } else {
      const { error } = await supabase.from('message_threads').update({
        client_id: clientId, contact_display_name: dto.contactDisplayName?.trim() || undefined,
        intent, priority, status, needs_owner: sensitive || phishing, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).eq('workspace_id', workspaceId).eq('id', threadId);
      if (error) throw new InternalServerErrorException(error.message);
    }

    const externalMessageId = dto.externalMessageId?.trim() || `demo_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const service = createServiceSupabaseClient();
    const { data: message, error: messageError } = await service.from('client_messages').insert({
      workspace_id: workspaceId, thread_id: threadId, client_id: clientId,
      direction: 'inbound', sender_type: 'client', external_message_id: externalMessageId,
      body: dto.body.trim(), original_language: dto.language ?? null, status: 'received', sensitive,
      metadata: { source: 'manual-demo' }
    }).select('*').single();
    if (messageError) {
      if ((messageError as any).code === '23505') throw new ConflictException('That inbound message was already ingested.');
      throw new InternalServerErrorException(messageError.message);
    }

    const { error: identityUpsertError } = await supabase.from('client_channel_identities').upsert({
      workspace_id: workspaceId, client_id: clientId, channel_id: dto.channelId,
      external_user_id: dto.externalUserId, display_name: dto.contactDisplayName?.trim() || null,
      match_confidence: dto.matchConfidence ?? 'verified'
    }, { onConflict: 'workspace_id,channel_id,external_user_id' });
    if (identityUpsertError) throw new InternalServerErrorException(identityUpsertError.message);
    return { threadId, message, intent, sensitive, phishing, priority, clientId };
  }

  async draftReply(user: AuthUser, workspaceId: string, threadId: string) {
    const detail = await this.getThread(user, workspaceId, threadId);
    const latestInbound = [...detail.messages].reverse().find((item: any) => item.direction === 'inbound');
    if (!latestInbound) throw new BadRequestException('No inbound message to reply to');
    const client = (detail.thread as any).client;
    const thread = detail.thread as any;
    const businessContext = client
      ? `Known client: ${client.display_name}; language=${client.language}; doNotAutoMessage=${client.do_not_auto_message}.`
      : 'Sender is not yet linked to a verified client record.';
    const instructions = `You are the AngelOS AI receptionist. Draft ONE concise client-facing reply. Be warm, natural, professional, and easy to understand. Never invent price, availability, policies, medical facts, or private arrival details. If a booking/availability question needs calendar confirmation, say you are checking or ask the owner to choose a slot; do not promise a time. If the message is a complaint, refund issue, emotional, sensitive, or identity-uncertain, prepare a careful draft but mark it as needing owner review. Reply in the client's apparent language when clear. ${businessContext} Thread intent=${thread.intent}.`;
    const response = await this.aiProvider.generate({ instructions, input: `Client: ${latestInbound.body}` });
    const sensitive = Boolean(latestInbound.sensitive) || thread.intent === 'complaint' || !client;
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('client_messages').insert({
      workspace_id: workspaceId, thread_id: threadId, client_id: client?.id ?? null,
      direction: 'outbound', sender_type: 'ai', body: response.text,
      status: 'pending_approval', sensitive,
      metadata: { provider: response.provider, model: response.model, draft_reason: 'ai_receptionist' },
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return { message: data, requiresApproval: true, reason: sensitive ? 'Sensitive or unverified context requires owner review.' : 'Guided autonomy requires approval for conversational replies in Sprint 5.' };
  }

  async createReply(user: AuthUser, workspaceId: string, threadId: string, dto: CreateReplyDto) {
    const detail = await this.getThread(user, workspaceId, threadId);
    const client = (detail.thread as any).client;
    const sensitive = isSensitive(dto.body, (detail.thread as any).intent);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('client_messages').insert({
      workspace_id: workspaceId, thread_id: threadId, client_id: client?.id ?? null,
      direction: 'outbound', sender_type: 'owner', body: dto.body.trim(),
      status: dto.sendNow ? 'queued' : 'draft', sensitive,
      routine_category: dto.routineCategory ?? null, created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    if (!dto.sendNow) return { message: data, sent: false };
    return this.sendMessage(user, workspaceId, data.id, true);
  }

  async approveAndSend(user: AuthUser, workspaceId: string, messageId: string) {
    return this.sendMessage(user, workspaceId, messageId, true);
  }

  async translateMessage(user: AuthUser, workspaceId: string, messageId: string, targetLanguage: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: message, error } = await supabase.from('client_messages').select('*').eq('workspace_id', workspaceId).eq('id', messageId).single();
    if (error || !message) throw new NotFoundException('Message not found');
    const response = await this.aiProvider.generate({
      instructions: `Translate the message naturally into ${targetLanguage}. Preserve meaning, names, numbers, prices, dates, and uncertainty. Return only the translation.`,
      input: message.body
    });
    const service = createServiceSupabaseClient();
    const { data: updated, error: updateError } = await service.from('client_messages').update({ translated_body: response.text, metadata: { ...(message.metadata ?? {}), translation_target: targetLanguage, translation_provider: response.provider } }).eq('workspace_id', workspaceId).eq('id', messageId).select('*').single();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    return updated;
  }

  async addInternalNote(user: AuthUser, workspaceId: string, threadId: string, content: string) {
    await this.getThread(user, workspaceId, threadId);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('message_internal_notes').insert({ workspace_id: workspaceId, thread_id: threadId, content: content.trim(), created_by: user.id }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateThread(user: AuthUser, workspaceId: string, threadId: string, dto: UpdateThreadDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.needsOwner !== undefined) updates.needs_owner = dto.needsOwner;
    const { data, error } = await supabase.from('message_threads').update(updates).eq('workspace_id', workspaceId).eq('id', threadId).select('*').single();
    if (error || !data) throw new NotFoundException('Message thread not found');
    return data;
  }

  private async sendMessage(user: AuthUser, workspaceId: string, messageId: string, explicitOwnerApproval = false) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: message, error: messageError } = await supabase.from('client_messages').select('*,thread:message_threads(*,channel:messaging_channels(*),client:clients(id,display_name,do_not_auto_message))').eq('workspace_id', workspaceId).eq('id', messageId).single();
    if (messageError || !message) throw new NotFoundException('Outbound message not found');
    if (message.direction !== 'outbound') throw new BadRequestException('Only outbound messages can be sent');
    if (message.status === 'sent') return { message, sent: true, duplicatePrevented: true };
    const thread = (message as any).thread;
    if (!thread?.channel) throw new NotFoundException('Messaging channel not found');
    if (!explicitOwnerApproval && thread.client?.do_not_auto_message && message.sender_type === 'ai') throw new ConflictException('Client is marked Do Not Auto-Message.');
    if (!explicitOwnerApproval && message.sensitive && message.sender_type === 'ai') throw new ConflictException('Sensitive AI draft requires owner approval before sending.');
    if (thread.channel.provider !== 'manual') throw new ConflictException('Live provider transport is not connected yet. This Sprint 5 build safely stops instead of pretending the message was sent.');

    const idempotencyKey = `message:${message.id}`;
    const service = createServiceSupabaseClient();
    const { data: existing } = await service.from('message_send_attempts').select('*').eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing?.status === 'sent') {
      const { data: refreshed } = await supabase.from('client_messages').select('*').eq('id', message.id).single();
      return { message: refreshed, sent: true, duplicatePrevented: true };
    }
    const attemptNo = Number(existing?.attempt_no ?? 0) + 1;
    if (existing) {
      const queued = await service.from('message_send_attempts').update({ status: 'queued', attempt_no: attemptNo, error_message: null }).eq('workspace_id', workspaceId).eq('id', existing.id);
      if (queued.error) throw new InternalServerErrorException(queued.error.message);
    } else {
      const queued = await service.from('message_send_attempts').insert({ workspace_id: workspaceId, message_id: message.id, channel_id: thread.channel.id, idempotency_key: idempotencyKey, attempt_no: attemptNo, status: 'queued' });
      if (queued.error) throw new InternalServerErrorException(queued.error.message);
    }

    const result = await this.manualAdapter.send({ externalThreadId: thread.external_thread_id, body: message.body, idempotencyKey });
    const { error: attemptError } = await service.from('message_send_attempts').update({
      status: result.status, provider_response: result.raw ?? null, error_message: result.error ?? null
    }).eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey);
    if (attemptError) throw new InternalServerErrorException(attemptError.message);
    if (result.status !== 'sent') {
      await service.from('client_messages').update({ status: 'failed' }).eq('id', message.id);
      throw new InternalServerErrorException(result.error ?? 'Message delivery could not be verified');
    }
    const sentAt = new Date().toISOString();
    const { data: sentMessage, error: updateError } = await service.from('client_messages').update({ status: 'sent', external_message_id: result.externalMessageId, sent_at: sentAt }).eq('id', message.id).select('*').single();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    await service.from('message_threads').update({ status: 'waiting_client', needs_owner: false, last_message_at: sentAt, updated_at: sentAt }).eq('id', thread.id);
    return { message: sentMessage, sent: true, duplicatePrevented: false };
  }
}

function classifyIntent(text: string) {
  if (/complain|refund|unhappy|angry|wrong/i.test(text)) return 'complaint';
  if (/resched|move my|change.*appointment|different time/i.test(text)) return 'reschedule';
  if (/available|availability|book|appointment|slot|free.*(today|tomorrow|saturday|sunday|monday|tuesday|wednesday|thursday|friday)/i.test(text)) return 'booking';
  if (/price|cost|how much|¥|yen|\$/i.test(text)) return 'price';
  if (/where|location|address|parking|find you|arrived/i.test(text)) return 'location';
  if (/aftercare|healing|wash|care/i.test(text)) return 'aftercare';
  if (/student|course|training|class/i.test(text)) return 'student';
  if (/follow.?up|checking in/i.test(text)) return 'follow_up';
  return 'inquiry';
}

function isSensitive(text: string, intent: string) {
  return intent === 'complaint' || SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

function looksLikePhishing(text: string) {
  return /(verify|confirm|unlock|suspend).*account/i.test(text) || /(password|one[- ]?time code|otp|gift card|crypto wallet)/i.test(text) || /(click|open).*https?:\/\//i.test(text);
}
