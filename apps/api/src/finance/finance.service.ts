import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient } from '../config/supabase';
import type { RecordFinanceEntryDto } from './dto/record-finance-entry.dto';

@Injectable()
export class FinanceService {
  async recordEntry(user: AuthUser, workspaceId: string, dto: RecordFinanceEntryDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: client, error: clientError } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', dto.clientId).single();
    if (clientError || !client) throw new NotFoundException('Client not found');
    if (dto.appointmentId) {
      const { data: appt, error } = await supabase.from('appointments').select('id,client_id,currency').eq('workspace_id', workspaceId).eq('id', dto.appointmentId).single();
      if (error || !appt) throw new NotFoundException('Appointment not found');
      if (appt.client_id !== dto.clientId) throw new ConflictException('Appointment belongs to a different client');
    }
    if (dto.entryType === 'correction' && !dto.correctionEffect) throw new ConflictException('Correction entries require a correction effect');
    const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('currency').eq('id', workspaceId).single();
    if (workspaceError || !workspace) throw new NotFoundException('Workspace not found');
    const payload = {
      workspace_id: workspaceId,
      client_id: dto.clientId,
      appointment_id: dto.appointmentId ?? null,
      entry_type: dto.entryType,
      amount: dto.amount,
      currency: dto.currency ?? workspace.currency,
      method: dto.method?.trim() || null,
      note: dto.note?.trim() || null,
      occurred_at: dto.occurredAt ?? new Date().toISOString(),
      idempotency_key: dto.idempotencyKey?.trim() || null,
      correction_effect: dto.entryType === 'correction' ? dto.correctionEffect : null,
      created_by: user.id
    };
    const { data, error } = await supabase.from('client_payment_entries').insert(payload).select('*').single();
    if (error) {
      if ((error as any).code === '23505' && payload.idempotency_key) {
        const existing = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).eq('idempotency_key', payload.idempotency_key).single();
        if (!existing.error && existing.data) return { entry: existing.data, duplicatePrevented: true };
      }
      throw new InternalServerErrorException(error.message);
    }
    return { entry: data, duplicatePrevented: false };
  }

  async appointmentSummary(user: AuthUser, workspaceId: string, appointmentId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: appointment, error } = await supabase.from('appointments').select('id,client_id,service_name,price_snapshot,currency,status,start_at').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
    if (error || !appointment) throw new NotFoundException('Appointment not found');
    const { data: entries, error: entriesError } = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).eq('appointment_id', appointmentId).order('occurred_at');
    if (entriesError) throw new InternalServerErrorException(entriesError.message);
    const summary = summarizeLedger(entries ?? [], Number(appointment.price_snapshot));
    return { appointment, entries: entries ?? [], ...summary };
  }

  async overview(user: AuthUser, workspaceId: string, days = 30) {
    const safeDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 366);
    const since = new Date(Date.now() - safeDays * 86400000).toISOString();
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: entries, error } = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).gte('occurred_at', since).order('occurred_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    const rows = entries ?? [];
    const actualIncome = rows.reduce((sum: number, row: any) => sum + incomeEffect(row), 0);
    const byMethod: Record<string, number> = {};
    for (const row of rows as any[]) {
      const effect = incomeEffect(row);
      if (!effect) continue;
      const key = row.method || 'other';
      byMethod[key] = (byMethod[key] ?? 0) + effect;
    }
    return { days: safeDays, actualIncome, byMethod, entries: rows.slice(0, 100) };
  }
}

function summarizeLedger(entries: any[], appointmentPrice: number) {
  const explicitExpected = entries.filter((row) => row.entry_type === 'expected').reduce((sum: number, row) => sum + Number(row.amount || 0), 0);
  let expected = explicitExpected > 0 ? explicitExpected : appointmentPrice;
  let received = 0;
  let discounts = 0;
  let refunds = 0;
  for (const row of entries) {
    const amount = Number(row.amount || 0);
    if (row.entry_type === 'discount') discounts += amount;
    if (row.entry_type === 'deposit' || row.entry_type === 'payment') received += amount;
    if (row.entry_type === 'refund') { refunds += amount; received -= amount; }
    if (row.entry_type === 'correction') {
      if (row.correction_effect === 'increase_expected') expected += amount;
      if (row.correction_effect === 'decrease_expected') expected -= amount;
      if (row.correction_effect === 'increase_income') received += amount;
      if (row.correction_effect === 'decrease_income') received -= amount;
    }
  }
  const amountDue = Math.max(0, expected - discounts - received);
  return { expectedTotal: expected, discounts, actualReceived: received, refunds, amountDue, requiresOwnerConfirmationBeforeClientReminder: amountDue > 0 };
}

function incomeEffect(row: any) {
  const amount = Number(row.amount || 0);
  if (row.entry_type === 'deposit' || row.entry_type === 'payment') return amount;
  if (row.entry_type === 'refund') return -amount;
  if (row.entry_type === 'correction' && row.correction_effect === 'increase_income') return amount;
  if (row.entry_type === 'correction' && row.correction_effect === 'decrease_income') return -amount;
  return 0;
}
