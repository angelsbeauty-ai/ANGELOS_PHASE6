import { apiFetch } from './api';

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

export interface HermesOverview {
  workspaceId: string;
  pendingApprovals: number;
  needsAttention: number;
  pendingApprovalsItems: ApprovalItem[];
  attentionItems: AttentionItem[];
}

export function getHermesOverview(workspaceId: string) {
  return apiFetch<HermesOverview>(`/workspaces/${workspaceId}/hermes/overview`);
}

export type ApprovalDecision = 'approved' | 'rejected' | 'needs_revision';

// The endpoint returns a database row, with delivery evidence for messages.
export interface ApprovalDecisionResult {
  id: string;
  status: string;
  delivery?: {
    status: string;
    duplicatePrevented: boolean;
    attemptId: string;
  } | null;
}

export function decideApproval(
  approvalId: string,
  decision: ApprovalDecision,
  notes?: string,
  revisedContent?: string,
  workspaceId?: string
) {
  return apiFetch<ApprovalDecisionResult>('/approvals/decide', {
    method: 'POST',
    body: JSON.stringify({
      approvalId,
      decision,
      notes: notes || undefined,
      revisedContent: revisedContent || undefined,
      workspaceId: workspaceId || undefined
    })
  });
}
