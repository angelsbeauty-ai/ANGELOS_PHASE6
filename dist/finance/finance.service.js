"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let FinanceService = exports.FinanceService = class FinanceService {
    async recordEntry(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: client, error: clientError } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', dto.clientId).single();
        if (clientError || !client)
            throw new common_1.NotFoundException('Client not found');
        if (dto.appointmentId) {
            const { data: appt, error } = await supabase.from('appointments').select('id,client_id,currency').eq('workspace_id', workspaceId).eq('id', dto.appointmentId).single();
            if (error || !appt)
                throw new common_1.NotFoundException('Appointment not found');
            if (appt.client_id !== dto.clientId)
                throw new common_1.ConflictException('Appointment belongs to a different client');
        }
        if (dto.entryType === 'correction' && !dto.correctionEffect)
            throw new common_1.ConflictException('Correction entries require a correction effect');
        const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('currency').eq('id', workspaceId).single();
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
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
            if (error.code === '23505' && payload.idempotency_key) {
                const existing = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).eq('idempotency_key', payload.idempotency_key).single();
                if (!existing.error && existing.data)
                    return { entry: existing.data, duplicatePrevented: true };
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
        return { entry: data, duplicatePrevented: false };
    }
    async appointmentSummary(user, workspaceId, appointmentId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: appointment, error } = await supabase.from('appointments').select('id,client_id,service_name,price_snapshot,currency,status,start_at').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
        if (error || !appointment)
            throw new common_1.NotFoundException('Appointment not found');
        const { data: entries, error: entriesError } = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).eq('appointment_id', appointmentId).order('occurred_at');
        if (entriesError)
            throw new common_1.InternalServerErrorException(entriesError.message);
        const summary = summarizeLedger(entries ?? [], Number(appointment.price_snapshot));
        return { appointment, entries: entries ?? [], ...summary };
    }
    async overview(user, workspaceId, days = 30) {
        const safeDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 366);
        const since = new Date(Date.now() - safeDays * 86400000).toISOString();
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: entries, error } = await supabase.from('client_payment_entries').select('*').eq('workspace_id', workspaceId).gte('occurred_at', since).order('occurred_at', { ascending: false });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const rows = entries ?? [];
        const actualIncome = rows.reduce((sum, row) => sum + incomeEffect(row), 0);
        const byMethod = {};
        for (const row of rows) {
            const effect = incomeEffect(row);
            if (!effect)
                continue;
            const key = row.method || 'other';
            byMethod[key] = (byMethod[key] ?? 0) + effect;
        }
        return { days: safeDays, actualIncome, byMethod, entries: rows.slice(0, 100) };
    }
};
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)()
], FinanceService);
function summarizeLedger(entries, appointmentPrice) {
    const explicitExpected = entries.filter((row) => row.entry_type === 'expected').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    let expected = explicitExpected > 0 ? explicitExpected : appointmentPrice;
    let received = 0;
    let discounts = 0;
    let refunds = 0;
    for (const row of entries) {
        const amount = Number(row.amount || 0);
        if (row.entry_type === 'discount')
            discounts += amount;
        if (row.entry_type === 'deposit' || row.entry_type === 'payment')
            received += amount;
        if (row.entry_type === 'refund') {
            refunds += amount;
            received -= amount;
        }
        if (row.entry_type === 'correction') {
            if (row.correction_effect === 'increase_expected')
                expected += amount;
            if (row.correction_effect === 'decrease_expected')
                expected -= amount;
            if (row.correction_effect === 'increase_income')
                received += amount;
            if (row.correction_effect === 'decrease_income')
                received -= amount;
        }
    }
    const amountDue = Math.max(0, expected - discounts - received);
    return { expectedTotal: expected, discounts, actualReceived: received, refunds, amountDue, requiresOwnerConfirmationBeforeClientReminder: amountDue > 0 };
}
function incomeEffect(row) {
    const amount = Number(row.amount || 0);
    if (row.entry_type === 'deposit' || row.entry_type === 'payment')
        return amount;
    if (row.entry_type === 'refund')
        return -amount;
    if (row.entry_type === 'correction' && row.correction_effect === 'increase_income')
        return amount;
    if (row.entry_type === 'correction' && row.correction_effect === 'decrease_income')
        return -amount;
    return 0;
}
//# sourceMappingURL=finance.service.js.map