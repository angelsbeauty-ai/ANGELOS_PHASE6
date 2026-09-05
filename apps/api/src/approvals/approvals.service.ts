import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

interface ApprovalPayload {
  type: 'message' | 'content' | 'booking'; // Flow type
  sourceId: string; // Message ID, Content ID, Booking ID
  sourceChannel: string; // 'line', 'instagram', 'facebook', 'tiktok'
  content: string;
  clientId: string;
  clientName: string;
  context?: Record<string, any>;
  actionRequired?: string; // 'reply', 'publish', 'confirm'
}

interface ApprovalDecision {
  approvalId: string;
  decision: 'approved' | 'rejected' | 'needs_revision';
  notes?: string;
  revisedContent?: string;
}

@Injectable()
export class ApprovalsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );
  }

  /**
   * Flow 1: Client Message → Angel Approval
   * Receives inbound message from n8n (LINE, Instagram, etc.)
   * Stores in Supabase + notifies AngelOS
   */
  async createMessageApproval(payload: ApprovalPayload) {
    const { data: approval, error } = await this.supabase
      .from('approvals')
      .insert({
        type: payload.type,
        source_id: payload.sourceId,
        source_channel: payload.sourceChannel,
        content: payload.content,
        client_id: payload.clientId,
        client_name: payload.clientName,
        context: payload.context,
        action_required: payload.actionRequired || 'reply',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast real-time notification to AngelOS
    await this.notifyApprovalNeeded(approval);

    return approval;
  }

  /**
   * Flow 2: Content → Angel Approval
   * Similar to message approval, but for content drafts
   */
  async createContentApproval(payload: ApprovalPayload) {
    const { data: approval, error } = await this.supabase
      .from('approvals')
      .insert({
        type: 'content',
        source_id: payload.sourceId,
        source_channel: payload.sourceChannel,
        content: payload.content,
        client_id: payload.clientId,
        client_name: payload.clientName,
        context: payload.context,
        action_required: 'publish',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.notifyApprovalNeeded(approval);

    return approval;
  }

  /**
   * Flow 3: Booking → Angel Approval (if needed)
   */
  async createBookingApproval(payload: ApprovalPayload) {
    const { data: approval, error } = await this.supabase
      .from('approvals')
      .insert({
        type: 'booking',
        source_id: payload.sourceId,
        source_channel: payload.sourceChannel,
        content: payload.content,
        client_id: payload.clientId,
        client_name: payload.clientName,
        context: payload.context,
        action_required: 'confirm',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.notifyApprovalNeeded(approval);

    return approval;
  }

  /**
   * Angel reviews approvals, makes decision
   * Stores decision + triggers execution
   */
  async submitApprovalDecision(
    decision: ApprovalDecision,
    userId: string,
  ) {
    // Fetch the original approval
    const { data: approval, error: fetchError } = await this.supabase
      .from('approvals')
      .select('*')
      .eq('id', decision.approvalId)
      .single();

    if (fetchError) throw fetchError;

    // Store decision
    const { data: storedDecision, error: storeError } = await this.supabase
      .from('approvals')
      .update({
        status: decision.decision,
        decision_notes: decision.notes,
        decided_by: userId,
        decided_at: new Date().toISOString(),
        revised_content: decision.revisedContent,
      })
      .eq('id', decision.approvalId)
      .select()
      .single();

    if (storeError) throw storeError;

    // Execute the decision (send webhook to n8n)
    await this.executeApprovalDecision(approval, storedDecision);

    return storedDecision;
  }

  /**
   * Send approval to n8n for execution
   * n8n knows how to handle each flow type + decision
   */
  private async executeApprovalDecision(approval: any, decision: any) {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_APPROVAL_EXECUTE;

    if (!n8nWebhookUrl) {
      console.warn('N8N_WEBHOOK_APPROVAL_EXECUTE not configured');
      return;
    }

    try {
      const payload = {
        approvalId: approval.id,
        type: approval.type, // 'message', 'content', 'booking'
        decision: decision.status, // 'approved', 'rejected', 'needs_revision'
        sourceId: approval.source_id,
        sourceChannel: approval.source_channel,
        clientId: approval.client_id,
        content: decision.revised_content || approval.content,
        notes: decision.decision_notes,
        actionRequired: approval.action_required,
      };

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          'Failed to execute approval decision:',
          await response.text(),
        );
      }
    } catch (error) {
      console.error('Error sending approval to n8n:', error);
    }
  }

  /**
   * Get pending approvals (for AngelOS Approval screen)
   */
  async getPendingApprovals(limit = 50) {
    const { data, error } = await this.supabase
      .from('approvals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(approvalId: string) {
    const { data, error } = await this.supabase
      .from('approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Notify AngelOS via Supabase real-time
   * AngelOS Approval screen subscribes to this
   */
  private async notifyApprovalNeeded(approval: any) {
    // Supabase will automatically broadcast via real-time subscriptions
    // The approval row insert triggers a REALTIME event
    // AngelOS listens for these events
    console.log(`Approval needed: ${approval.type} from ${approval.client_name}`);
  }

  /**
   * Get approval history (for auditing)
   */
  async getApprovalHistory(
    clientId?: string,
    type?: string,
    limit = 100,
  ) {
    let query = this.supabase
      .from('approvals')
      .select('*')
      .order('decided_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return data;
  }
}
