"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesTaskService = void 0;
exports.validateBoundedCodexTask = validateBoundedCodexTask;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
function isCodexIntent(intent) {
    return ['build', 'fix', 'review'].includes(intent);
}
function validatePortablePath(value) {
    if (typeof value !== 'string' || !value || value.length > 240 ||
        /[\\:*?"<>|\x00-\x1f]/.test(value) || value.startsWith('/') ||
        value.split('/').some((part) => !part || part === '.' || part === '..' || /[. ]$/.test(part))) {
        throw new common_1.BadRequestException('task_json.files must contain exact repository-relative file paths');
    }
    return value;
}
function validateBoundedCodexTask(body) {
    if (!isCodexIntent(body.intent)) {
        throw new common_1.BadRequestException('Only build, fix, or review tasks can be submitted to the Codex worker');
    }
    if (typeof body.task_text !== 'string' || !body.task_text.trim() || body.task_text.length > 20000) {
        throw new common_1.BadRequestException('task_text is required and must be under 20000 characters');
    }
    const files = body.task_json?.files;
    const acceptanceCriteria = body.task_json?.acceptance_criteria;
    if (!Array.isArray(files) || files.length < 1 || files.length > 20 ||
        !Array.isArray(acceptanceCriteria) || acceptanceCriteria.length < 1) {
        throw new common_1.BadRequestException('task_json.files and task_json.acceptance_criteria are required for Codex tasks');
    }
    const normalizedFiles = files.map(validatePortablePath);
    if (new Set(normalizedFiles.map((file) => file.toLowerCase())).size !== normalizedFiles.length) {
        throw new common_1.BadRequestException('task_json.files contains duplicate paths');
    }
    const normalizedCriteria = acceptanceCriteria.map((criterion) => {
        if (typeof criterion !== 'string' || !criterion.trim() || criterion.length > 2000) {
            throw new common_1.BadRequestException('task_json.acceptance_criteria must contain non-empty strings under 2000 characters');
        }
        return criterion;
    });
    return { files: normalizedFiles, acceptance_criteria: normalizedCriteria };
}
let HermesTaskService = class HermesTaskService {
    async workspaceId(user) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('workspace_memberships')
            .select('workspace_id')
            .eq('user_id', user.id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        const memberships = (data ?? []).map((r) => r.workspace_id);
        if (!memberships.length)
            throw new common_1.BadRequestException('No workspace found for this account');
        return memberships[0];
    }
    async create(user, body, workspaceId) {
        const wsId = workspaceId ?? await this.workspaceId(user);
        const boundedTaskJson = validateBoundedCodexTask(body);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const now = new Date().toISOString();
        if (body.source_ref) {
            const { data: existing } = await supabase
                .from('hermes_tasks')
                .select('id')
                .eq('workspace_id', wsId)
                .eq('source_ref', body.source_ref)
                .maybeSingle();
            if (existing)
                return this.getOne(user, existing.id);
        }
        const { data, error } = await supabase
            .from('hermes_tasks')
            .insert({
            workspace_id: wsId,
            source: body.source ?? 'api',
            source_ref: body.source_ref ?? null,
            source_channel: body.source_channel ?? 'angelos_api',
            intent: body.intent,
            task_text: body.task_text,
            task_json: boundedTaskJson,
            status: 'queued',
            needs_owner_approval: body.needs_owner_approval ?? false,
            n8n_execution_id: body.n8n_execution_id ?? null,
            n8n_callback_url: body.n8n_callback_url ?? null,
            n8n_status: 'queued',
            created_by: user.id,
            created_at: now,
            updated_at: now
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.BadRequestException('Could not create task');
        return data;
    }
    async getOne(user, taskId) {
        return this.getOneForWorkspace(user, taskId);
    }
    async getOneForWorkspace(user, taskId, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        let query = supabase
            .from('hermes_tasks')
            .select('*')
            .eq('id', taskId);
        if (workspaceId)
            query = query.eq('workspace_id', workspaceId);
        const { data, error } = await query.single();
        if (error)
            throw new common_1.NotFoundException('Task not found');
        if (!data)
            throw new common_1.NotFoundException('Task not found');
        return data;
    }
    async getCodexTaskStatus(user, taskId, workspaceId) {
        const task = await this.getOneForWorkspace(user, taskId, workspaceId);
        return {
            id: task.id,
            workspace_id: task.workspace_id,
            intent: task.intent,
            status: task.status,
            n8n_status: task.n8n_status,
            result: task.hermes_result,
            error: task.hermes_error,
            started_at: task.hermes_started_at,
            finished_at: task.hermes_finished_at,
            updated_at: task.updated_at
        };
    }
    async listRecent(user, limit = 50) {
        const wsId = await this.workspaceId(user);
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('hermes_tasks')
            .select('*')
            .eq('workspace_id', wsId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data ?? [];
    }
    async updateStatus(user, taskId, body) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const updates = { updated_at: new Date().toISOString() };
        for (const [k, v] of Object.entries(body)) {
            if (v !== undefined)
                updates[k] = v;
        }
        const { data, error } = await supabase
            .from('hermes_tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Task not found');
        return data;
    }
};
exports.HermesTaskService = HermesTaskService;
exports.HermesTaskService = HermesTaskService = __decorate([
    (0, common_1.Injectable)()
], HermesTaskService);
//# sourceMappingURL=hermes-task.service.js.map