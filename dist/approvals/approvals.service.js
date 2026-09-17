"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const staging_message_execution_service_1 = require("../messaging/staging-message-execution.service");
let ApprovalsService = class ApprovalsService {
    stagingExecution;
    constructor(stagingExecution) {
        this.stagingExecution = stagingExecution;
    }
    async resolveWorkspaceId(user, requestedWorkspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('workspace_memberships')
            .select('workspace_id')
            .eq('user_id', user.id);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const memberships = (data ?? []).map((row) => row.workspace_id);
        if (!memberships.length) {
            throw new common_1.ForbiddenException('No workspace is available for this account.');
        }
        if (requestedWorkspaceId) {
            if (!memberships.includes(requestedWorkspaceId)) {
                throw new common_1.ForbiddenException('You are not a member of that workspace.');
            }
            return requestedWorkspaceId;
        }
        if (memberships.length > 1) {
            throw new common_1.BadRequestException('workspaceId is required when the account has multiple workspaces.');
        }
        return memberships[0];
    }
    async assertNotEmergencyPaused(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('workspace_operational_controls')
            .select('emergency_read_only')
            .eq('workspace_id', workspaceId)
            .maybeSingle();
        if (error || !data) {
            throw new common_1.ServiceUnavailableException('Operational safety controls unavailable');
        }
        if (data.emergency_read_only) {
            throw new common_1.ConflictException('AngelOS is in emergency read-only mode. Approvals cannot be dispatched until the owner resumes them.');
        }
    }
    async createApproval(user, payload, fallbackAction) {
        const workspaceId = await this.resolveWorkspaceId(user, payload.workspaceId);
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
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
        if (error) {
            if (error.code === '23505') {
                const { data: existing, error: existingError } = await supabase
                    .from('approvals')
                    .select('*')
                    .eq('workspace_id', workspaceId)
                    .eq('type', payload.type)
                    .eq('source_id', payload.sourceId)
                    .maybeSingle();
                if (existingError)
                    throw new common_1.InternalServerErrorException(existingError.message);
                if (existing)
                    return existing;
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
        await this.notifyApprovalNeeded(approval);
        return approval;
    }
    async createMessageApproval(user, payload) {
        const workspaceId = await this.resolveWorkspaceId(user, payload.workspaceId);
        if ((0, staging_message_execution_service_1.flow1StagingEnabled)(workspaceId)) {
            return this.stagingExecution.prepare(user, workspaceId, payload.sourceId, payload.content, payload.clientId, payload.sourceChannel);
        }
        return this.createApproval(user, { ...payload, type: 'message' }, 'reply');
    }
    async createContentApproval(user, payload) {
        return this.createApproval(user, { ...payload, type: 'content' }, 'publish');
    }
    async createBookingApproval(user, payload) {
        return this.createApproval(user, { ...payload, type: 'booking' }, 'confirm');
    }
    async submitApprovalDecision(user, decision, workspaceId) {
        const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
        await this.assertNotEmergencyPaused(user, scopedWorkspaceId);
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data: existing, error: fetchError } = await supabase
            .from('approvals')
            .select('*')
            .eq('id', decision.approvalId)
            .eq('workspace_id', scopedWorkspaceId)
            .maybeSingle();
        if (fetchError)
            throw new common_1.InternalServerErrorException(fetchError.message);
        if (!existing)
            throw new common_1.NotFoundException('Approval not found.');
        if (existing.type === 'message')
            return this.stagingExecution.decide(user, scopedWorkspaceId, decision);
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
        if (updateError)
            throw new common_1.InternalServerErrorException(updateError.message);
        if (!updated) {
            throw new common_1.ConflictException('This approval has already been decided.');
        }
        const { error: historyError } = await supabase.from('approval_history').insert({
            approval_id: updated.id,
            workspace_id: scopedWorkspaceId,
            status_change: `pending -> ${decision.decision}`,
            changed_by: user.id,
            changed_at: decidedAt,
            notes: decision.notes ?? null
        });
        if (historyError)
            throw new common_1.InternalServerErrorException(historyError.message);
        await this.executeApprovalDecision(existing, updated);
        return updated;
    }
    async executeMessageApproval(user, approvalId, workspaceId) {
        const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
        return this.stagingExecution.execute(user, scopedWorkspaceId, approvalId);
    }
    async executeApprovalDecision(approval, decision) {
        if (approval.type === 'message')
            throw new common_1.ConflictException('Message approvals must use the guarded staging execution bridge');
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
        }
        catch (error) {
            console.error('Error sending approval to n8n:', error);
        }
    }
    async getPendingApprovals(user, limit = 50, workspaceId) {
        const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('approvals')
            .select('*')
            .eq('workspace_id', scopedWorkspaceId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async getApprovalById(user, approvalId, workspaceId) {
        const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('approvals')
            .select('*')
            .eq('id', approvalId)
            .eq('workspace_id', scopedWorkspaceId)
            .maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Approval not found.');
        return data;
    }
    async notifyApprovalNeeded(approval) {
        console.log(`Approval needed: ${approval.type} from ${approval.client_name}`);
    }
    async getApprovalHistory(user, clientId, type, limit = 100, workspaceId) {
        const scopedWorkspaceId = await this.resolveWorkspaceId(user, workspaceId);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        let query = supabase
            .from('approval_history')
            .select('*, approval:approvals!inner(type,client_id,client_name,source_channel,content,status)')
            .eq('workspace_id', scopedWorkspaceId)
            .order('changed_at', { ascending: false });
        if (clientId)
            query = query.eq('approval.client_id', clientId);
        if (type)
            query = query.eq('approval.type', type);
        const { data, error } = await query.limit(limit);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [staging_message_execution_service_1.StagingMessageExecutionService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map