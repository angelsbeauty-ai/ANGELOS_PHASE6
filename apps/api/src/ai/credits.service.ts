import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';

/** -1 = unlimited (founder or open-source Ollama plan). */
const ALLOWANCE: Record<string, number> = {
  free: 0,
  automations: 0,
  ollama: -1,
  brain: -1,
  solo: 200,
  full: 200
};

export interface CreditSnapshot {
  planCode: string;
  periodStart: string;
  allowance: number;
  used: number;
  remaining: number | 'unlimited';
  unlimited: boolean;
  openaiEnabled: boolean;
  note: string;
}

@Injectable()
export class CreditsService {
  async getSnapshot(user: AuthUser, workspaceId: string): Promise<CreditSnapshot> {
    await this.assertMember(user, workspaceId);
    return this.loadOrSeed(user, workspaceId);
  }

  async consume(user: AuthUser, workspaceId: string, reason: string): Promise<CreditSnapshot> {
    const mode = (process.env.AI_PROVIDER_MODE ?? 'mock').trim();
    if (mode !== 'openai') {
      return this.getSnapshot(user, workspaceId);
    }

    const snap = await this.loadOrSeed(user, workspaceId);
    if (!snap.openaiEnabled) {
      throw new HttpException(
        {
          message: 'This plan does not include OpenAI. Use Ollama (no credits) or upgrade to Full.',
          remaining: snap.remaining
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }
    if (!snap.unlimited && typeof snap.remaining === 'number' && snap.remaining <= 0) {
      throw new HttpException(
        {
          message: 'No OpenAI credits left this month. Upgrade or wait for the monthly reset.',
          remaining: 0
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    const service = createServiceSupabaseClient();
    if (!snap.unlimited) {
      const { error } = await service
        .from('workspace_ai_credits')
        .update({ used: snap.used + 1, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId);
      if (error) throw new InternalServerErrorException(error.message);
    }
    await service.from('workspace_ai_credit_events').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      delta: snap.unlimited ? 0 : -1,
      reason,
      provider: 'openai'
    });

    return this.loadOrSeed(user, workspaceId);
  }

  private isFounder(user: AuthUser) {
    const raw = process.env.FOUNDER_USER_IDS ?? '';
    return raw.split(',').map((v) => v.trim()).filter(Boolean).includes(user.id);
  }

  private async assertMember(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('workspaces').select('id').eq('id', workspaceId).single();
    if (error || !data) throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
  }

  private periodStart() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }

  private async loadOrSeed(user: AuthUser, workspaceId: string): Promise<CreditSnapshot> {
    const service = createServiceSupabaseClient();
    const founder = this.isFounder(user);
    const { data: sub } = await service
      .from('workspace_subscriptions')
      .select('plan_code')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    const planCode = founder ? 'full' : (sub?.plan_code ?? 'free');
    const allowance = founder ? -1 : (ALLOWANCE[planCode] ?? 0);
    const periodStart = this.periodStart();
    const openaiEnabled = founder || allowance === -1 || allowance > 0;
    // Ollama plan is unlimited but must not burn OpenAI.
    const usesOpenAi = founder || planCode === 'solo' || planCode === 'full';

    const { data: row } = await service
      .from('workspace_ai_credits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!row || row.period_start !== periodStart || row.plan_code !== planCode || row.allowance !== allowance) {
      const next = {
        workspace_id: workspaceId,
        plan_code: planCode,
        period_start: periodStart,
        allowance,
        used: row && row.period_start === periodStart ? row.used : 0,
        updated_at: new Date().toISOString()
      };
      const { error } = await service.from('workspace_ai_credits').upsert(next, { onConflict: 'workspace_id' });
      if (error) throw new InternalServerErrorException(error.message);
    }

    const { data: fresh, error: freshError } = await service
      .from('workspace_ai_credits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();
    if (freshError || !fresh) throw new InternalServerErrorException(freshError?.message ?? 'credits missing');

    const unlimited = fresh.allowance < 0 || founder;
    const remaining = unlimited ? 'unlimited' : Math.max(0, fresh.allowance - fresh.used);
    let note = 'Free and Automations plans do not include OpenAI credits.';
    if (planCode === 'ollama' || planCode === 'brain') note = 'Ollama plan: talking AI with no OpenAI credits.';
    if (usesOpenAi) note = 'Full plan: each chat or voice reply uses 1 OpenAI credit from Angel\'s key.';
    if (founder) note = 'Founder: unlimited OpenAI. Usage is still logged.';

    return {
      planCode,
      periodStart: fresh.period_start,
      allowance: fresh.allowance,
      used: fresh.used,
      remaining,
      unlimited,
      openaiEnabled: usesOpenAi || founder,
      note
    };
  }
}
