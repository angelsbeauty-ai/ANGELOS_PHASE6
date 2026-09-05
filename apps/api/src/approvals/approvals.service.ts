import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { AuthUser } from '../auth/auth-user';

interface ApprovalPayload {
  type: 'message' | 'content' | 'booking';
  sourceId: string; // Message ID, Content ID, Booking ID
  sourceChannel: string; // 'line', 'instagram', 'facebook', 'tiktok'
  content: string;
  clientId: string;
  clientName: string;
  context?: Record<string, any>;
  actionRequired?: string; // 'reply', 'publish', 'confirm'
  workspaceId?: string;
}

interface ApprovalDecision {
  approvalId: string;
  decision: 'approved' | 'rejected' | 'needs_revision';
  notes?: string;
  revisedContent?: string;
}

@Injectable()
export class ApprovalsService {
  /**
   * Every approval row is workspace-scoped (approvals.workspace_id is NOT NULL and
   * RLS enforces is_workspace_member). Callers either name a workspace explicitly or
   * we fall back to the caller's own membership; either way membership is verified
   * before anything is written or read.
   */
  private async resolveWorkspaceId(user: AuthUser, requestedWorkspaceId?: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (error) throw new InternalServerErrorException(error.message);

    const memberships = (data ?? []).map((row: any) => row.workspace_id);
    if (!memberships.length) {
      throw new ForbiddenException('No workspace is available for this account.');
    }

    if (requestedWorkspaceId) {
      if (!memberships.includes(requestedWorkspaceId)) {
        throw new ForbiddenException('You are not a member of that workspace.');
      }
      return requestedWorkspaceId;
    }

    if (memberships.length > 1) {
      throw new BadRequestException('workspaceId is required when the account has multiple workspaces.');
    }

    return memberships[0];
  }

  private async createApproval(user: AuthUser, payload: ApprovalPayload, fallbackAction: string) {
    const workspaceId = await this.resolveWorkspaceId(user, payload.workspaceId);
    const supabase = createServiceSupabaseClient();

    const { data: approval, error } = await supabase
      .from('approvals')
      .insert({
        workspace_id: workspaceId,
        type: payload.type,
        source_id: payload.sourceId,
        source_channel: payload.sourceChannel,
        content: payload.content,
        client_id: payload.clientId,
        client_name: payload.clientName,
        context: payload.context ?? null,
        action_required: payload.actionRequired || fallbackAction,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    await this.notifyApprovalNeeded(approval);

    return approval;
  }

  /**
   * Flow 1: Client message (LINE, Instagram, ...) arrives from n8n and needs Angel's approval.
   */
  async createMessageApproval(user: AuthUser, payload: ApprovalPayload) {
    return this.createApproval(user, { ...payload, type: 'message' }, 'reply');
  }

  /**
   * Flow 2: Content draft needs approval before publishing.
   */
  async createContentApproval(user: AuthUser, payload: ApprovalPayload) {
    return this.createApproval(user, { ...payload, type: 'content' }, 'publish');
  }

  /**
   * Flow 3: Booking request/change may need confirmation.
   */
  async createBookingApproval(user: AuthUser, payload: ApprovalPayload) {
    return this.createApproval(user, { ...payload, type: 'booking' }, 'confirm');
  }

  /**
   * Angel reviews an approval and decides.
   *
   * The status update is written as a single conditional UPDATE (... WHERE status = 'pending').
   * That is what makes this safe against a double tap or a duplicate request: only the first
   * one matches a pending row, so the decision — and the downstream send — happens exactly once.
   */
  async submitApprovalDecision(user: AuthUser, decision: ApprovalDecision, workspaceId?: string) {
    const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
    const supabase = createServiceSupabaseClient();

    const { data: existing, error: fetchError } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', decision.approvalId)
      .eq('workspace_id', scopedWorkspaceId)
      .maybeSingle();

    if (fetchError) throw new InternalServerErrorException(fetchError.message);
    if (!existing) throw new NotFoundException('Approval not found.');

    const decidedAt = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('approvals')
      .update({
        status: decision.decision,
        decision_notes: decision.notes ?? null,
        decided_by: user.id,
        decided_at: decidedAt,
        revised_content: decision.revisedContent ?? null,
        updated_at: decidedAt
      })
      .eq('id', decision.approvalId)
      .eq('workspace_id', scopedWorkspaceId)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (updateError) throw new InternalServerErrorException(updateError.message);
    if (!updated) {
      // The row existed but was no longer pending: another tap/request already decided it.
      throw new ConflictException('This approval has already been decided.');
    }

    // Audit trail. Written after the guarded update so history only records real transitions.
    const { error: historyError } = await supabase.from('approval_history').insert({
      approval_id: updated.id,
      workspace_id: scopedWorkspaceId,
      status_change: `pending -> ${decision.decision}`,
      changed_by: user.id,
      changed_at: decidedAt,
      notes: decision.notes ?? null
    });

    if (historyError) throw new InternalServerErrorException(historyError.message);

    await this.executeApprovalDecision(existing, updated);

    return updated;
  }

  /**
   * Hand the decision to n8n for execution.
   *
   * NOTE: this is still the direct-execute path. Routing decisions through the existing
   * guarded-send path (WF-49) is deliberately a separate step and is not wired up here yet.
   */
  private async executeApprovalDecision(approval: any, decision: any) {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_APPROVAL_EXECUTE;

    if (!n8nWebhookUrl) {
      console.warn('N8N_WEBHOOK_APPROVAL_EXECUTE not configured; decision stored but not dispatched.');
      return;
    }

    try {
      const payload = {
        approvalId: approval.id,
        workspaceId: approval.workspace_id,
        type: approval.type,
        decision: decision.status,
        sourceId: approval.source_id,
        sourceChannel: approval.source_channel,
        clientId: approval.client_id,
        content: decision.revised_content || approval.content,
        notes: decision.decision_notes,
        actionRequired: approval.action_required
      };

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to execute approval decision:', await response.text());
      }
    } catch (error) {
      console.error('Error sending approval to n8n:', error);
    }
  }

  /**
   * Pending approvals for the AngelOS Approvals screen.
   */
  async getPendingApprovals(user: AuthUser, limit = 50, workspaceId?: string) {
    const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
    const supabase = createUserSupabaseClient(user.accessToken);

    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('workspace_id', scopedWorkspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new InternalServerErrorException(error.message);

    return data ?? [];
  }

  async getApprovalById(user: AuthUser, approvalId: string, workspaceId?: string) {
    const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
    const supabase = createUserSupabaseClient(user.accessToken);

    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', approvalId)
      .eq('workspace_id', scopedWorkspaceId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Approval not found.');

    return data;
  }

  private async notifyApprovalNeeded(approval: any) {
    // The row insert itself is the notification: the Approvals screen subscribes to
    // postgres_changes on public.approvals, and RLS scopes what each account receives.
    console.log(`Approval needed: ${approval.type} from ${approval.client_name}`);
  }

  /**
   * Decision audit log, newest first.
   */
  async getApprovalHistory(
    user: AuthUser,
    clientId?: string,
    type?: string,
    limit = 100,
    workspaceId?: string
  ) {
    const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
    const supabase = createUserSupabaseClient(user.accessToken);

    let query = supabase
      .from('approval_history')
      .select('*, approval:approvals!inner(type,client_id,client_name,source_channel,content,status)')
      .eq('workspace_id', scopedWorkspaceId)
      .order('changed_at', { ascending: false });

    if (clientId) query = query.eq('approval.client_id', clientId);
    if (type) query = query.eq('approval.type', type);

    const { data, error } = await query.limit(limit);

    if (error) throw new InternalServerErrorException(error.message);

    return data ?? [];
  }
}
