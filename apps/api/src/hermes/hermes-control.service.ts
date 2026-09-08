import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient, createServiceSupabaseClient } from '../config/supabase';

export interface HermesOverview {
  workspaceId: string;
  pendingApprovals: number;
  needsAttention: number;
  pendingApprovalsItems: ApprovalItem[];
  attentionItems: AttentionItem[];
}

export interface ApprovalItem {
  id: string;
  type: 'message' | 'content' | 'booking';
  status: string;
  sourceId: string;
  sourceChannel: string;
  content: string;
  clientName: string;
  createdAt: string;
}

export interface AttentionItem {
  id: string;
  severity: string;
  title: string;
  summary: string;
  status: string;
  managedBy: string;
  createdAt: string;
}

@Injectable()
export class HermesControlService {
  async getOverviewAsSystem(workspaceId: string) {
    const supabase = createServiceSupabaseClient();
    return this.getOverviewFromSupabase(workspaceId, supabase);
  }

  private async getOverviewFromSupabase(workspaceId: string, supabase: ReturnType<typeof createServiceSupabaseClient>) {
    const [approvalsResult, attentionResult] = await Promise.all([
      supabase
        .from('approvals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('attention_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'open')
        .order('severity', { ascending: false })
    ]);

    const pendingApprovals = (approvalsResult.data ?? []).map((a: any) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      sourceId: a.source_id,
      sourceChannel: a.source_channel,
      content: a.content,
      clientName: a.client_name,
      createdAt: a.created_at
    }));

    const attentionItems = (attentionResult.data ?? []).map((a: any) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      summary: a.summary,
      status: a.status,
      managedBy: a.managed_by,
      createdAt: a.created_at
    }));

    return {
      workspaceId,
      pendingApprovals: pendingApprovals.length,
      needsAttention: attentionItems.length,
      pendingApprovalsItems: pendingApprovals,
      attentionItems
    };
  }
}
