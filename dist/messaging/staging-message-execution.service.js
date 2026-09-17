"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StagingMessageExecutionService = void 0;
exports.flow1StagingEnabled = flow1StagingEnabled;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const provider_adapter_1 = require("./provider-adapter");
function flow1StagingEnabled(workspaceId) {
    return process.env.NODE_ENV === 'staging'
        && process.env.FLOW1_STAGING_EXECUTION_ENABLED === 'true'
        && process.env.FLOW1_STAGING_WORKSPACE_ID === workspaceId;
}
let StagingMessageExecutionService = class StagingMessageExecutionService {
    manualAdapter = new provider_adapter_1.ManualDemoMessagingAdapter();
    assertEnabled(workspaceId) {
        if (!flow1StagingEnabled(workspaceId))
            throw new common_1.ConflictException('Flow 1 execution requires an explicitly enabled staging workspace');
    }
    async rpc(name, args) {
        const { data, error } = await (0, supabase_1.createServiceSupabaseClient)().rpc(name, args);
        if (error) {
            if (['42501', '55000', '22023', 'P0002', '23505'].includes(error.code))
                throw new common_1.ConflictException(error.message);
            throw new common_1.InternalServerErrorException('Flow 1 database transaction failed; delivery is not retried automatically');
        }
        return data;
    }
    async prepare(user, workspaceId, sourceId, content, clientId, channel) {
        this.assertEnabled(workspaceId);
        return this.rpc('flow1_prepare_approval', { p_workspace: workspaceId, p_actor: user.id, p_source: sourceId, p_content: content, p_client: clientId, p_channel: channel });
    }
    async decide(user, workspaceId, decision) {
        this.assertEnabled(workspaceId);
        const approval = await this.rpc('flow1_decide_approval', {
            p_workspace: workspaceId, p_actor: user.id, p_approval: decision.approvalId,
            p_decision: decision.decision, p_notes: decision.notes ?? null, p_revised: decision.revisedContent ?? null
        });
        const delivery = approval.status === 'approved' ? await this.execute(user, workspaceId, approval.id) : null;
        return { ...approval, delivery };
    }
    async execute(user, workspaceId, approvalId) {
        this.assertEnabled(workspaceId);
        const claim = await this.rpc('flow1_claim_execution', { p_workspace: workspaceId, p_actor: user.id, p_approval: approvalId });
        if (!claim.claimed)
            return { status: claim.attempt.status, duplicatePrevented: true, attemptId: claim.attempt.id };
        let result;
        try {
            if (claim.provider !== 'manual' || !String(claim.externalThreadId).startsWith('synthetic:'))
                throw new Error('Synthetic adapter routing required');
            result = await this.manualAdapter.send({ externalThreadId: claim.externalThreadId, body: claim.message.body, idempotencyKey: claim.attempt.idempotency_key });
            if (!['sent', 'failed', 'unknown'].includes(result.status) || (result.status === 'sent' && !result.externalMessageId)) {
                result = { status: 'unknown', error: 'Provider did not return valid delivery evidence' };
            }
        }
        catch {
            result = { status: 'unknown', error: 'Provider outcome is uncertain; automatic replay is blocked' };
        }
        const attempt = await this.rpc('flow1_finish_execution', {
            p_workspace: workspaceId, p_attempt: claim.attempt.id, p_status: result.status,
            p_external_id: result.externalMessageId ?? null, p_error: result.error ?? null, p_response: result.raw ?? null
        });
        return { status: attempt.status, duplicatePrevented: false, attemptId: attempt.id };
    }
};
exports.StagingMessageExecutionService = StagingMessageExecutionService;
exports.StagingMessageExecutionService = StagingMessageExecutionService = __decorate([
    (0, common_1.Injectable)()
], StagingMessageExecutionService);
//# sourceMappingURL=staging-message-execution.service.js.map