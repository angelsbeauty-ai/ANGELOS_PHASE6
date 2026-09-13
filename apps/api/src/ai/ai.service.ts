import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import { planSafeAssistantAction } from './action-planner';
import { buildOperatingInstructions } from './angelos-operating-contract';
import { AiProviderService } from './ai-provider.service';
import type { AssistantProfile, AssistantRoleRow, AiMessageRow } from './ai.types';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMemoryDto } from './dto/create-memory.dto';
import type { SendAiMessageDto } from './dto/send-ai-message.dto';
import type { UpdateAssistantProfileDto } from './dto/update-assistant-profile.dto';
import type { UpdateAssistantRolesDto } from './dto/update-assistant-roles.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';

export type SendVoiceResult =
  | { transcript: string; reply: string }
  | { error: string; status: number };

@Injectable()
export class AiService {
  constructor(private readonly provider: AiProviderService) {}

  async getProfile(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from('ai_assistant_profiles').select('*').eq('workspace_id', workspaceId).single(),
      supabase.from('ai_assistant_roles').select('role_key,enabled').eq('workspace_id', workspaceId).order('role_key')
    ]);

    if (profileError || !profile) throw new NotFoundException('Assistant profile not found for workspace');
    if (rolesError) throw new InternalServerErrorException(rolesError.message);
    return { profile, roles: roles ?? [] };
  }

  async updateProfile(user: AuthUser, workspaceId: string, dto: UpdateAssistantProfileDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.displayName !== undefined) updates.display_name = dto.displayName.trim();
    if (dto.avatarKey !== undefined) updates.avatar_key = dto.avatarKey;
    if (dto.personalityPrompt !== undefined) updates.personality_prompt = dto.personalityPrompt;
    if (dto.primaryLanguage !== undefined) updates.primary_language = dto.primaryLanguage;
    if (dto.tone !== undefined) updates.tone = dto.tone;
    if (dto.responseLength !== undefined) updates.response_length = dto.responseLength;
    if (dto.proactivity !== undefined) updates.proactivity = dto.proactivity;
    if (dto.floatingButtonMode !== undefined) updates.floating_button_mode = dto.floatingButtonMode;
    if (dto.guidanceQuestionsEnabled !== undefined) updates.guidance_questions_enabled = dto.guidanceQuestionsEnabled;
    if (dto.explainRecommendations !== undefined) updates.explain_recommendations = dto.explainRecommendations;

    if (typeof updates.display_name === 'string' && !updates.display_name) {
      throw new BadRequestException('Assistant name cannot be empty');
    }

    const { data, error } = await supabase
      .from('ai_assistant_profiles')
      .update(updates)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateRoles(user: AuthUser, workspaceId: string, dto: UpdateAssistantRolesDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const rows = Object.entries(dto.roles ?? {}).map(([role_key, enabled]) => ({
      workspace_id: workspaceId,
      role_key,
      enabled: Boolean(enabled),
      updated_at: new Date().toISOString()
    }));
    if (!rows.length) return this.getProfile(user, workspaceId);

    const { error } = await supabase.from('ai_assistant_roles').upsert(rows, { onConflict: 'workspace_id,role_key' });
    if (error) throw new InternalServerErrorException(error.message);
    return this.getProfile(user, workspaceId);
  }

  async createConversation(user: AuthUser, workspaceId: string, dto: CreateConversationDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        title: dto.title?.trim() || 'New conversation',
        current_screen: dto.currentScreen ?? null,
        current_entity_type: dto.currentEntityType ?? null,
        current_entity_id: dto.currentEntityId ?? null
      })
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async listMessages(user: AuthUser, workspaceId: string, conversationId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id,author_type,content,metadata,created_at')
      .eq('workspace_id', workspaceId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async sendMessage(user: AuthUser, workspaceId: string, conversationId: string, dto: SendAiMessageDto) {
    const message = dto.message?.trim();
    if (!message) throw new BadRequestException('Message is required');

    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .select('id,workspace_id')
      .eq('id', conversationId)
      .eq('workspace_id', workspaceId)
      .single();
    if (conversationError || !conversation) throw new NotFoundException('Conversation not found');

    if (dto.context) {
      await supabase
        .from('ai_conversations')
        .update({
          current_screen: dto.context.screen ?? null,
          current_entity_type: dto.context.entityType ?? null,
          current_entity_id: dto.context.entityId ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    const { error: userMessageError } = await supabase.from('ai_messages').insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      author_type: 'user',
      content: message,
      created_by: user.id,
      metadata: dto.context ? { context: dto.context } : {}
    });
    if (userMessageError) throw new InternalServerErrorException(userMessageError.message);

    const [workspaceResult, profileResult, rolesResult, memoryResult, historyResult] = await Promise.all([
      supabase.from('workspaces').select('id,name').eq('id', workspaceId).single(),
      supabase.from('ai_assistant_profiles').select('*').eq('workspace_id', workspaceId).single(),
      supabase.from('ai_assistant_roles').select('role_key,enabled').eq('workspace_id', workspaceId),
      supabase.from('ai_memory_items').select('content').eq('workspace_id', workspaceId).eq('status', 'approved').limit(50),
      supabase
        .from('ai_messages')
        .select('id,author_type,content,metadata,created_at')
        .eq('workspace_id', workspaceId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (workspaceResult.error || !workspaceResult.data) throw new NotFoundException('Workspace not found');
    if (profileResult.error || !profileResult.data) throw new NotFoundException('Assistant profile not found');
    if (rolesResult.error) throw new InternalServerErrorException(rolesResult.error.message);
    if (memoryResult.error) throw new InternalServerErrorException(memoryResult.error.message);
    if (historyResult.error) throw new InternalServerErrorException(historyResult.error.message);

    const history = ((historyResult.data ?? []) as AiMessageRow[]).reverse();
    const transcript = history
      .map((row) => `${row.author_type === 'assistant' ? 'Assistant' : row.author_type === 'user' ? 'Owner' : 'System'}: ${row.content}`)
      .join('\n');

    const contextFacts = await this.loadAuthorizedContextFacts(supabase, workspaceId, dto.context);
    const instructions = buildOperatingInstructions({
      workspaceName: workspaceResult.data.name,
      profile: profileResult.data as AssistantProfile,
      roles: (rolesResult.data ?? []) as AssistantRoleRow[],
      approvedMemory: (memoryResult.data ?? []).map((row: any) => row.content),
      context: dto.context,
      contextFacts
    });

    const providerResponse = await this.provider.generate({
      instructions,
      input: transcript || `Owner: ${message}`
    });

    const plannedAction = planSafeAssistantAction(message);
    let actionRun: any = null;
    if (plannedAction) {
      const serviceSupabase = createServiceSupabaseClient();
      const { data, error } = await serviceSupabase
        .from('ai_action_runs')
        .insert({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          requested_by: user.id,
          action_key: plannedAction.actionKey,
          risk_level: plannedAction.riskLevel,
          status: 'proposed',
          input: plannedAction.input
        })
        .select('*')
        .single();
      if (error) throw new InternalServerErrorException(error.message);
      actionRun = { ...data, summary: plannedAction.summary, requiresApproval: true };
    }

    const assistantMetadata = {
      provider: providerResponse.provider,
      model: providerResponse.model,
      actionRunId: actionRun?.id ?? null
    };
    const serviceSupabaseForMessage = createServiceSupabaseClient();
    const { data: assistantMessage, error: assistantMessageError } = await serviceSupabaseForMessage
      .from('ai_messages')
      .insert({
        workspace_id: workspaceId,
        conversation_id: conversationId,
        author_type: 'assistant',
        content: providerResponse.text,
        metadata: assistantMetadata
      })
      .select('id,author_type,content,metadata,created_at')
      .single();
    if (assistantMessageError) throw new InternalServerErrorException(assistantMessageError.message);

    return { message: assistantMessage, action: actionRun };
  }

  async approveAction(user: AuthUser, workspaceId: string, actionId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(supabase, workspaceId);
    const serviceSupabase = createServiceSupabaseClient();
    const { data: controls, error: controlsError } = await serviceSupabase.from('workspace_operational_controls').select('pause_ai_actions,emergency_read_only').eq('workspace_id', workspaceId).single();
    if (controlsError) throw new InternalServerErrorException(controlsError.message);
    if (controls?.emergency_read_only) throw new BadRequestException('AngelOS is in emergency read-only mode. AI can still chat, but it cannot change business data.');
    if (controls?.pause_ai_actions) throw new BadRequestException('AI actions are paused by the workspace owner.');
    const { data: action, error } = await serviceSupabase
      .from('ai_action_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', actionId)
      .eq('status', 'proposed')
      .single();
    if (error || !action) throw new NotFoundException('Proposed action not found');

    const approvedAt = new Date().toISOString();
    await serviceSupabase
      .from('ai_action_runs')
      .update({ status: 'running', approved_by: user.id, approved_at: approvedAt, updated_at: approvedAt })
      .eq('id', actionId);

    try {
      let result: Record<string, unknown>;
      if (action.action_key === 'update_assistant_name') {
        const displayName = String(action.input?.displayName ?? '').trim();
        if (!displayName) throw new Error('Missing assistant display name');
        const { data, error: updateError } = await serviceSupabase
          .from('ai_assistant_profiles')
          .update({ display_name: displayName, updated_at: new Date().toISOString() })
          .eq('workspace_id', workspaceId)
          .select('display_name')
          .single();
        if (updateError) throw updateError;
        result = { displayName: data.display_name };
      } else if (action.action_key === 'propose_memory') {
        const content = String(action.input?.content ?? '').trim();
        const category = String(action.input?.category ?? 'preference');
        const { data, error: memoryError } = await serviceSupabase
          .from('ai_memory_items')
          .insert({
            workspace_id: workspaceId,
            category,
            content,
            status: 'approved',
            source: 'user_approved_action',
            created_by: user.id,
            approved_by: user.id,
            approved_at: approvedAt
          })
          .select('id,category,content,status')
          .single();
        if (memoryError) throw memoryError;
        result = { memory: data };
      } else {
        throw new Error(`Unsupported action: ${action.action_key}`);
      }

      const verification = await this.verifyAction(user, workspaceId, action.action_key, action.input);
      if (!verification.verified) {
        throw new Error('Action mutation could not be verified');
      }
      const { data: completed, error: completionError } = await serviceSupabase
        .from('ai_action_runs')
        .update({
          status: 'succeeded',
          result,
          verification,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select('*')
        .single();
      if (completionError) throw completionError;
      return completed;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unknown action failure';
      await serviceSupabase
        .from('ai_action_runs')
        .update({ status: 'failed', result: { error: message }, updated_at: new Date().toISOString() })
        .eq('id', actionId);
      throw new InternalServerErrorException(message);
    }
  }

  async cancelAction(user: AuthUser, workspaceId: string, actionId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(supabase, workspaceId);
    const serviceSupabase = createServiceSupabaseClient();
    const { data, error } = await serviceSupabase
      .from('ai_action_runs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', actionId)
      .eq('status', 'proposed')
      .select('*')
      .single();
    if (error || !data) throw new NotFoundException('Proposed action not found');
    return data;
  }

  async proposeMemory(user: AuthUser, workspaceId: string, dto: CreateMemoryDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const content = dto.content?.trim();
    if (!content) throw new BadRequestException('Memory content is required');
    const { data, error } = await supabase
      .from('ai_memory_items')
      .insert({
        workspace_id: workspaceId,
        category: dto.category,
        content,
        status: 'proposed',
        source: 'user',
        created_by: user.id
      })
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async listMemory(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('ai_memory_items')
      .select('id,category,content,status,created_at,approved_at')
      .eq('workspace_id', workspaceId)
      .neq('status', 'retired')
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async sendVoice(
    _user: AuthUser,
    _workspaceId: string,
    dto: SendVoiceMessageDto,
  ): Promise<SendVoiceResult> {
    try {
      const base64 = dto.audioBase64.trim();
      if (!base64 || base64.length < 100) {
        return { error: 'Audio too short', status: 400 };
      }

      // STT via Supabase Edge Function (ai-agent-voice) is not deployed yet.
      // Accept the voice upload so the mobile app can keep talking to Hermes;
      // the reply tells the user transcription is pending.
      this.logger.warn(
        'ai-agent-voice Edge Function is not deployed — transcription pending. ' +
          `audio bytes received: ${base64.length}`,
      );

      return {
        transcript: '',
        reply:
          '🎤 Voice received. Transcription is not wired up on the server yet — ' +
          "the audio was recorded but I couldn't turn it into text. Try typing the " +
          'treatment / note instead for now, or wait for the voice pipeline to be deployed.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice endpoint error';
      this.logger.error(`sendVoice failed: ${message}`);
      return { error: message, status: 500 };
    }
  }

  private async loadAuthorizedContextFacts(
    supabase: ReturnType<typeof createUserSupabaseClient>,
    workspaceId: string,
    context?: { screen?: string; entityType?: string; entityId?: string }
  ) {
    if (!context?.entityId) return [];

    if (context.entityType === 'client') {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id,display_name,language,status,phone,email,do_not_auto_message')
        .eq('workspace_id', workspaceId)
        .eq('id', context.entityId)
        .single();
      if (clientError || !client) return [];

      const [{ data: treatments }, { data: notes }] = await Promise.all([
        supabase.from('treatment_records').select('service_name,stage,technique,performed_at,notes').eq('workspace_id', workspaceId).eq('client_id', context.entityId).order('performed_at', { ascending: false }).limit(3),
        supabase.from('client_notes').select('note_type,content,created_at').eq('workspace_id', workspaceId).eq('client_id', context.entityId).order('created_at', { ascending: false }).limit(5)
      ]);
      const facts = [`Client: ${client.display_name}; status=${client.status}; language=${client.language}; doNotAutoMessage=${client.do_not_auto_message}`];
      for (const treatment of treatments ?? []) facts.push(`Treatment ${treatment.performed_at}: ${treatment.service_name}; stage=${treatment.stage}; technique=${treatment.technique ?? 'not recorded'}; notes=${treatment.notes ?? 'none'}`);
      for (const note of notes ?? []) facts.push(`Client note (${note.note_type}, ${note.created_at}): ${note.content}`);
      return facts;
    }

    if (context.entityType === 'content_post') {
      const { data: post, error: postError } = await supabase
        .from('content_posts')
        .select('id,title,objective,primary_format,status,strategy_reason,source_goal,variants:content_variants(platform,format,hook,caption,cta,hashtags,status,scheduled_for),media:content_post_media(position,role,asset:media_assets(original_filename,media_type,marketing_permission,content_status))')
        .eq('workspace_id', workspaceId)
        .eq('id', context.entityId)
        .single();
      if (postError || !post) return [];
      const facts = [
        `Content post: ${post.title}; objective=${post.objective}; format=${post.primary_format}; status=${post.status}`,
        `Strategy: ${post.strategy_reason ?? 'not recorded'}; ownerGoal=${post.source_goal ?? 'not recorded'}`
      ];
      for (const item of (post as any).media ?? []) facts.push(`Media ${item.position}: ${item.asset?.original_filename ?? 'unknown'}; type=${item.asset?.media_type ?? 'unknown'}; permission=${item.asset?.marketing_permission ?? 'unknown'}; contentStatus=${item.asset?.content_status ?? 'unknown'}`);
      for (const variant of (post as any).variants ?? []) facts.push(`${variant.platform} variant: format=${variant.format}; status=${variant.status}; hook=${variant.hook ?? 'none'}; caption=${variant.caption}; CTA=${variant.cta ?? 'none'}; scheduled=${variant.scheduled_for ?? 'not scheduled'}`);
      return facts;
    }

    if (context.entityType === 'message_thread') {
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .select('id,status,intent,priority,needs_owner,contact_display_name,client:clients(id,display_name,language,do_not_auto_message),channel:messaging_channels(provider,display_name,status)')
        .eq('workspace_id', workspaceId).eq('id', context.entityId).single();
      if (threadError || !thread) return [];
      const { data: messages } = await supabase.from('client_messages').select('direction,sender_type,body,status,sensitive,created_at').eq('workspace_id', workspaceId).eq('thread_id', context.entityId).order('created_at', { ascending: false }).limit(8);
      const client: any = (thread as any).client;
      const channel: any = (thread as any).channel;
      const facts = [
        `Message thread: intent=${thread.intent}; status=${thread.status}; priority=${thread.priority}; needsOwner=${thread.needs_owner}`,
        `Channel: ${channel?.display_name ?? 'unknown'} (${channel?.provider ?? 'unknown'}); connectionStatus=${channel?.status ?? 'unknown'}`,
        `Client/lead: ${client?.display_name ?? thread.contact_display_name ?? 'unidentified'}; language=${client?.language ?? 'unknown'}; doNotAutoMessage=${client?.do_not_auto_message ?? 'unknown'}`
      ];
      for (const item of (messages ?? []).reverse()) facts.push(`${item.direction === 'inbound' ? 'Client' : 'Business'} message (${item.created_at}, ${item.status}${item.sensitive ? ', sensitive' : ''}): ${item.body}`);
      return facts;
    }

    return [];
  }

  private async assertWorkspaceAccess(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string) {
    const { data, error } = await supabase.from('workspaces').select('id').eq('id', workspaceId).single();
    if (error || !data) throw new NotFoundException('Workspace not found');
  }

  private async verifyAction(user: AuthUser, workspaceId: string, actionKey: string, input: any) {
    const supabase = createUserSupabaseClient(user.accessToken);
    if (actionKey === 'update_assistant_name') {
      const { data, error } = await supabase
        .from('ai_assistant_profiles')
        .select('display_name')
        .eq('workspace_id', workspaceId)
        .single();
      if (error) throw error;
      const expected = String(input?.displayName ?? '').trim();
      return { verified: data.display_name === expected, expected, actual: data.display_name };
    }

    if (actionKey === 'propose_memory') {
      const content = String(input?.content ?? '').trim();
      const { data, error } = await supabase
        .from('ai_memory_items')
        .select('id,status')
        .eq('workspace_id', workspaceId)
        .eq('content', content)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return { verified: Boolean(data?.length), memoryId: data?.[0]?.id ?? null };
    }

    return { verified: false, reason: 'No verifier registered' };
  }
}
