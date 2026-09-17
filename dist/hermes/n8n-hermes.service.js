"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nHermesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let N8nHermesService = class N8nHermesService {
    async createTask(body) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const workspaceId = body.workspaceId || 'default';
        const now = new Date().toISOString();
        const execId = body.n8n_execution_id || 'n8n-' + now;
        const insertData = {
            workspace_id: workspaceId,
            source: body.source || 'telegram',
            source_ref: body.source_ref || null,
            source_channel: body.source_channel || null,
            intent: body.intent,
            task_text: body.task_text,
            task_json: body.task_json || null,
            status: 'queued',
            needs_owner_approval: body.needs_owner_approval || false,
            n8n_execution_id: execId,
            n8n_callback_url: body.n8n_callback_url || null,
            n8n_status: 'queued',
            created_by: null,
            created_at: now,
            updated_at: now
        };
        if (body.source_ref) {
            const { data: existing } = await supabase
                .from('hermes_tasks')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('source_ref', body.source_ref)
                .maybeSingle();
            if (existing) {
                const { data: task, error: fetchError } = await supabase
                    .from('hermes_tasks')
                    .select('*')
                    .eq('id', existing.id)
                    .single();
                if (fetchError || !task)
                    throw new Error('Task not found after idempotency check');
                return task;
            }
        }
        const { data, error } = await supabase
            .from('hermes_tasks')
            .insert(insertData)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to create task: ${error.message}`);
        if (!data)
            throw new Error('No task returned after insert');
        return data;
    }
    async getOverview(workspaceId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
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
        const pendingApprovals = (approvalsResult.data ?? []).map((a) => ({
            id: a.id,
            type: a.type,
            status: a.status,
            sourceId: a.source_id,
            sourceChannel: a.source_channel,
            content: a.content,
            clientName: a.client_name,
            createdAt: a.created_at
        }));
        const attentionItems = (attentionResult.data ?? []).map((a) => ({
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
    async executeTask(taskId, model, timeoutMs) {
        const { HermesBuilderExecutor } = await Promise.resolve().then(() => require('./hermes-builder-executor.service'));
        const executor = new HermesBuilderExecutor();
        return executor.execute({ taskId, model, timeoutMs });
    }
};
exports.N8nHermesService = N8nHermesService;
exports.N8nHermesService = N8nHermesService = __decorate([
    (0, common_1.Injectable)()
], N8nHermesService);
//# sourceMappingURL=n8n-hermes.service.js.map