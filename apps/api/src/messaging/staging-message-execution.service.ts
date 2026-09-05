import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient } from '../config/supabase';
import { ManualDemoMessagingAdapter, type MessagingSendResult } from './provider-adapter';

export function flow1StagingEnabled(workspaceId: string) {
  return process.env.NODE_ENV === 'staging'
    && process.env.FLOW1_STAGING_EXECUTION_ENABLED === 'true'
    && process.env.FLOW1_STAGING_WORKSPACE_ID === workspaceId;
}

@Injectable()
export class StagingMessageExecutionService {
  // Reuse the existing no-network transport. Live adapters are intentionally absent.
  private readonly manualAdapter = new ManualDemoMessagingAdapter();

  private assertEnabled(workspaceId: string) {
    if (!flow1StagingEnabled(workspaceId)) throw new ConflictException('Flow 1 execution requires an explicitly enabled staging workspace');
  }

  private async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await createServiceSupabaseClient().rpc(name, args);
    if (error) {
      if (['42501', '55000', '22023', 'P0002', '23505'].includes(error.code)) throw new ConflictException(error.message);
      throw new InternalServerErrorException('Flow 1 database transaction failed; delivery is not retried automatically');
    }
    return data;
  }

  async prepare(user: AuthUser, workspaceId: string, sourceId: string, content: string, clientId: string, channel: string) {
    this.assertEnabled(workspaceId);
    return this.rpc('flow1_prepare_approval', { p_workspace: workspaceId, p_actor: user.id, p_source: sourceId, p_content: content, p_client: clientId, p_channel: channel });
  }

  async decide(user: AuthUser, workspaceId: string, decision: { approvalId: string; decision: string; notes?: string; revisedContent?: string }) {
    this.assertEnabled(workspaceId);
    const approval = await this.rpc('flow1_decide_approval', {
      p_workspace: workspaceId, p_actor: user.id, p_approval: decision.approvalId,
      p_decision: decision.decision, p_notes: decision.notes ?? null, p_revised: decision.revisedContent ?? null
    });
    const delivery = approval.status === 'approved' ? await this.execute(user, workspaceId, approval.id) : null;
    return { ...approval, delivery };
  }

  async execute(user: AuthUser, workspaceId: string, approvalId: string) {
    this.assertEnabled(workspaceId);
    const claim = await this.rpc('flow1_claim_execution', { p_workspace: workspaceId, p_actor: user.id, p_approval: approvalId });
    if (!claim.claimed) return { status: claim.attempt.status, duplicatePrevented: true, attemptId: claim.attempt.id };

    let result: MessagingSendResult;
    try {
      if (claim.provider !== 'manual' || !String(claim.externalThreadId).startsWith('synthetic:')) throw new Error('Synthetic adapter routing required');
      result = await this.manualAdapter.send({ externalThreadId: claim.externalThreadId, body: claim.message.body, idempotencyKey: claim.attempt.idempotency_key });
      if (!['sent', 'failed', 'unknown'].includes(result.status) || (result.status === 'sent' && !result.externalMessageId)) {
        result = { status: 'unknown', error: 'Provider did not return valid delivery evidence' };
      }
    } catch {
      result = { status: 'unknown', error: 'Provider outcome is uncertain; automatic replay is blocked' };
    }

    // If this write fails, the committed claim stays unknown. A retry may record
    // evidence, but must never invoke the adapter a second time.
    const attempt = await this.rpc('flow1_finish_execution', {
      p_workspace: workspaceId, p_attempt: claim.attempt.id, p_status: result.status,
      p_external_id: result.externalMessageId ?? null, p_error: result.error ?? null, p_response: result.raw ?? null
    });
    return { status: attempt.status, duplicatePrevented: false, attemptId: attempt.id };
  }
}
