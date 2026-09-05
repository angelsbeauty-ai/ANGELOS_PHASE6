import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient } from '../config/supabase';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';
import type { CreateClientNoteDto } from './dto/create-note.dto';
import type { CreateTreatmentDto } from './dto/create-treatment.dto';
import type { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ClientsService {
  async list(user: AuthUser, workspaceId: string, search?: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    let query = supabase
      .from('clients')
      .select('id,display_name,first_name,last_name,email,phone,language,status,source,do_not_auto_message,created_at,updated_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(100);

    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.ilike('display_name', `%${safeSearch}%`);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async create(user: AuthUser, workspaceId: string, dto: CreateClientDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const displayName = dto.displayName.trim();
    const email = dto.email?.trim().toLowerCase() || null;
    const phone = dto.phone?.trim() || null;

    if (!displayName) throw new ConflictException('Client display name is required');
    await this.assertUniqueContact(supabase, workspaceId, email, phone);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        first_name: dto.firstName?.trim() || null,
        last_name: dto.lastName?.trim() || null,
        display_name: displayName,
        email,
        phone,
        language: dto.language ?? 'en',
        status: dto.status ?? 'lead',
        source: dto.source?.trim() || null,
        do_not_auto_message: dto.doNotAutoMessage ?? false,
        created_by: user.id
      })
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async get(user: AuthUser, workspaceId: string, clientId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const clientResult = await supabase.from('clients').select('*').eq('workspace_id', workspaceId).eq('id', clientId).single();
    if (clientResult.error || !clientResult.data) throw new NotFoundException('Client not found');

    const [notes, treatments, consents, payments, followups] = await Promise.all([
      supabase.from('client_notes').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('treatment_records').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('performed_at', { ascending: false }).limit(50),
      supabase.from('client_consents').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('client_followups').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('created_at', { ascending: false }).limit(50)
    ]);
    for (const result of [notes, treatments, consents, payments, followups]) {
      if (result.error) throw new InternalServerErrorException(result.error.message);
    }

    return {
      client: clientResult.data,
      notes: notes.data ?? [],
      treatments: treatments.data ?? [],
      consents: consents.data ?? [],
      payments: payments.data ?? [],
      followups: followups.data ?? []
    };
  }

  async update(user: AuthUser, workspaceId: string, clientId: string, dto: UpdateClientDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    if (dto.displayName !== undefined && !dto.displayName.trim()) throw new ConflictException('Client display name is required');
    await this.assertUniqueContact(supabase, workspaceId, dto.email?.trim().toLowerCase(), dto.phone?.trim(), clientId);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.firstName !== undefined) updates.first_name = dto.firstName?.trim() || null;
    if (dto.lastName !== undefined) updates.last_name = dto.lastName?.trim() || null;
    if (dto.displayName !== undefined) updates.display_name = dto.displayName.trim();
    if (dto.email !== undefined) updates.email = dto.email?.trim().toLowerCase() || null;
    if (dto.phone !== undefined) updates.phone = dto.phone?.trim() || null;
    if (dto.language !== undefined) updates.language = dto.language;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.source !== undefined) updates.source = dto.source?.trim() || null;
    if (dto.doNotAutoMessage !== undefined) updates.do_not_auto_message = dto.doNotAutoMessage;

    const { data, error } = await supabase.from('clients').update(updates).eq('workspace_id', workspaceId).eq('id', clientId).select('*').single();
    if (error || !data) throw new NotFoundException('Client not found');
    return data;
  }

  async addNote(user: AuthUser, workspaceId: string, clientId: string, dto: CreateClientNoteDto) {
    await this.assertClient(user, workspaceId, clientId);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('client_notes').insert({
      workspace_id: workspaceId,
      client_id: clientId,
      note_type: dto.noteType ?? 'general',
      content: dto.content.trim(),
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async addTreatment(user: AuthUser, workspaceId: string, clientId: string, dto: CreateTreatmentDto) {
    await this.assertClient(user, workspaceId, clientId);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('treatment_records').insert({
      workspace_id: workspaceId,
      client_id: clientId,
      service_name: dto.serviceName.trim(),
      stage: dto.stage ?? 'first_session',
      technique: dto.technique?.trim() || null,
      performed_at: dto.performedAt ?? new Date().toISOString(),
      notes: dto.notes?.trim() || null,
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async addConsent(user: AuthUser, workspaceId: string, clientId: string, dto: CreateConsentDto) {
    await this.assertClient(user, workspaceId, clientId);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('client_consents').insert({
      workspace_id: workspaceId,
      client_id: clientId,
      consent_type: dto.consentType,
      status: dto.status,
      scope: dto.scope ?? {},
      form_version: dto.formVersion ?? null,
      signed_at: dto.status === 'granted' ? new Date().toISOString() : null,
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async assertUniqueContact(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string, email?: string | null, phone?: string | null, excludeId?: string) {
    for (const [field, value] of [['email', email], ['phone', phone]]) {
      if (!value) continue;
      let query = supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq(field!, value).limit(1);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query;
      if (error) throw new InternalServerErrorException(error.message);
      if (data?.length) throw new ConflictException('A client with matching contact information already exists');
    }
  }

  private async assertClient(user: AuthUser, workspaceId: string, clientId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', clientId).single();
    if (error || !data) throw new NotFoundException('Client not found');
  }
}

function sanitizeSearch(value?: string) {
  return value?.trim().replace(/[%,()]/g, '').slice(0, 100) || '';
}
