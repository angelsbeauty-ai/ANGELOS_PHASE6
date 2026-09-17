"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesSystemService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let HermesSystemService = exports.HermesSystemService = class HermesSystemService {
    async createAsSystem(workspaceId, body, n8nExecutionId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date().toISOString();
        const execId = n8nExecutionId ?? body.n8n_execution_id ?? 'n8n-' + now;
        if (body.source_ref && workspaceId) {
            const { data: existing } = await supabase
                .from('hermes_tasks')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('source_ref', body.source_ref)
                .maybeSingle();
            if (existing)
                return this.getOneAsSystem(existing.id);
        }
        const { data, error } = await supabase
            .from('hermes_tasks')
            .insert({
            workspace_id: workspaceId ?? 'unknown',
            source: body.source ?? 'telegram',
            source_ref: body.source_ref ?? null,
            source_channel: body.source_channel ?? null,
            intent: body.intent,
            task_text: body.task_text,
            task_json: body.task_json ?? null,
            status: 'queued',
            needs_owner_approval: body.needs_owner_approval ?? false,
            n8n_execution_id: execId,
            n8n_callback_url: body.n8n_callback_url ?? null,
            n8n_status: 'queued',
            created_by: null,
            created_at: now,
            updated_at: now
        })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        if (!data)
            throw new Error('Could not create task');
        return data;
    }
    async getOneAsSystem(taskId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('hermes_tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        if (error)
            throw new Error('Task not found');
        if (!data)
            throw new Error('Task not found');
        return data;
    }
};
exports.HermesSystemService = HermesSystemService = __decorate([
    (0, common_1.Injectable)()
], HermesSystemService);
//# sourceMappingURL=hermes-system.service.js.map