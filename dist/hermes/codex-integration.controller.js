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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodexIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const n8nsecret_guard_1 = require("../common/guards/n8nsecret.guard");
const hermes_task_service_1 = require("./hermes-task.service");
const uuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const terminal = new Set(['done', 'failed', 'timeout', 'cancelled', 'rejected', 'awaiting_approval']);
let CodexIntegrationController = exports.CodexIntegrationController = class CodexIntegrationController {
    client() { return (0, supabase_1.createServiceSupabaseClient)(); }
    async conversation(workspaceId, conversationId) {
        if (!uuid(workspaceId) || !uuid(conversationId))
            throw new common_1.BadRequestException('Valid workspace and conversation IDs are required');
        const { data, error } = await this.client().from('ai_conversations').select('id,created_by')
            .eq('workspace_id', workspaceId).eq('id', conversationId).maybeSingle();
        if (error)
            throw new common_1.ServiceUnavailableException('Conversation lookup failed');
        if (!data)
            throw new common_1.NotFoundException('Conversation not found in workspace');
        return data;
    }
    async task(workspaceId, taskId) {
        if (!uuid(workspaceId) || !uuid(taskId))
            throw new common_1.BadRequestException('Valid workspace and task IDs are required');
        const { data, error } = await this.client().from('hermes_tasks').select('*')
            .eq('workspace_id', workspaceId).eq('id', taskId).eq('source_channel', 'codex_integration').maybeSingle();
        if (error)
            throw new common_1.ServiceUnavailableException('Task lookup failed');
        if (!data)
            throw new common_1.NotFoundException('Integration task not found in workspace');
        return data;
    }
    async submit(workspaceId, body) {
        const spec = (0, hermes_task_service_1.validateBoundedCodexTask)(body);
        if (!uuid(body.request_id))
            throw new common_1.BadRequestException('request_id must be a stable UUID reused on retries');
        const conversation = await this.conversation(workspaceId, body.conversation_id);
        const client = this.client();
        const { data: controls, error: controlsError } = await client.from('workspace_operational_controls')
            .select('emergency_read_only,pause_ai_actions').eq('workspace_id', workspaceId).maybeSingle();
        if (controlsError || !controls)
            throw new common_1.ServiceUnavailableException('Workspace controls unavailable');
        if (controls.emergency_read_only || controls.pause_ai_actions)
            throw new common_1.ConflictException('Development tasks are paused');
        const sourceRef = `codex:${body.conversation_id}:${body.request_id}`;
        const expected = { intent: body.intent, task_text: body.task_text, task_json: spec };
        const { data, error } = await client.from('hermes_tasks').insert({
            ...expected, workspace_id: workspaceId, source: 'api', source_channel: 'codex_integration',
            source_ref: sourceRef, status: 'queued', n8n_status: 'queued', created_by: conversation.created_by,
            needs_owner_approval: false
        }).select('*').single();
        if (!error)
            return data;
        if (error.code !== '23505')
            throw new common_1.ServiceUnavailableException('Task submission failed');
        const { data: existing, error: lookupError } = await client.from('hermes_tasks').select('*')
            .eq('workspace_id', workspaceId).eq('source_ref', sourceRef).maybeSingle();
        if (lookupError || !existing)
            throw new common_1.ServiceUnavailableException('Task retry lookup failed');
        if (existing.intent !== expected.intent || existing.task_text !== expected.task_text ||
            JSON.stringify(existing.task_json?.files) !== JSON.stringify(spec.files) ||
            JSON.stringify(existing.task_json?.acceptance_criteria) !== JSON.stringify(spec.acceptance_criteria)) {
            throw new common_1.ConflictException('request_id already belongs to a different task');
        }
        return existing;
    }
    async status(workspaceId, taskId) {
        const task = await this.task(workspaceId, taskId);
        return { id: task.id, status: task.status, result: task.hermes_result, error: task.hermes_error,
            started_at: task.hermes_started_at, finished_at: task.hermes_finished_at };
    }
    async deliver(workspaceId, taskId) {
        const task = await this.task(workspaceId, taskId);
        if (!terminal.has(task.status))
            throw new common_1.ConflictException('Task has no final report yet');
        const conversationId = String(task.source_ref ?? '').split(':')[1];
        await this.conversation(workspaceId, conversationId);
        const result = task.hermes_result ?? {};
        const report = { taskId: task.id, status: task.status, summary: result.summary ?? task.hermes_error ?? '',
            changedFiles: result.files_changed ?? [], tests: result.test_result ?? { status: 'not_run', commands: [] },
            blockers: result.blockers ?? (task.hermes_error ? [task.hermes_error] : []),
            approvalRequired: result.approval_required ?? [], sourceCheckoutModified: result.source_checkout_modified ?? null };
        const metadata = { type: 'development_task_result', ...report };
        const content = `${report.summary}\n\n${JSON.stringify(report, null, 2)}\n\nCode changes are not applied automatically.`;
        const { error } = await this.client().from('ai_messages').insert({ id: task.id, workspace_id: workspaceId,
            conversation_id: conversationId, author_type: 'assistant', content, metadata });
        if (error && error.code !== '23505')
            throw new common_1.ServiceUnavailableException('Report delivery failed');
        if (error) {
            const { data, error: lookupError } = await this.client().from('ai_messages').select('metadata')
                .eq('id', task.id).eq('workspace_id', workspaceId).eq('conversation_id', conversationId).maybeSingle();
            if (lookupError || data?.metadata?.type !== 'development_task_result' || data?.metadata?.taskId !== task.id) {
                throw new common_1.ConflictException('Report ID collision');
            }
        }
        return { delivered: true, task_id: task.id, message_id: task.id, already_delivered: !!error };
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CodexIntegrationController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(':taskId/status'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodexIntegrationController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':taskId/deliver'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodexIntegrationController.prototype, "deliver", null);
exports.CodexIntegrationController = CodexIntegrationController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/integrations/codex/tasks'),
    (0, common_1.UseGuards)(n8nsecret_guard_1.N8nSecretGuard)
], CodexIntegrationController);
//# sourceMappingURL=codex-integration.controller.js.map