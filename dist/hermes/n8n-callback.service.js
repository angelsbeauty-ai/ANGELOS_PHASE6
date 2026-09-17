"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nCallbackService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let N8nCallbackService = exports.N8nCallbackService = class N8nCallbackService {
    async recordTaskResult(taskId, executionId, result, error) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date().toISOString();
        const { data: task, error: fetchError } = await supabase
            .from('hermes_tasks')
            .select('*')
            .eq('id', taskId)
            .maybeSingle();
        if (fetchError || !task)
            throw new common_1.NotFoundException('Task not found');
        const status = error ? 'failed' : 'done';
        const updateResult = await supabase
            .from('hermes_tasks')
            .update({
            status,
            hermes_result: result,
            hermes_error: error ?? null,
            hermes_finished_at: now,
            n8n_status: status,
            n8n_execution_id: executionId ?? task.n8n_execution_id,
            updated_at: now
        })
            .eq('id', taskId)
            .select()
            .single();
        const data = updateResult.data;
        const updateErrorResult = updateResult.error;
        if (updateErrorResult || !data)
            throw new common_1.BadRequestException(updateErrorResult?.message ?? 'Update failed');
        if (!data)
            throw new common_1.NotFoundException('Task not found');
        if (task.n8n_callback_url && task.source_channel === 'telegram') {
            this.fireCallback(task.n8n_callback_url, task, result, error);
        }
        return { success: true, taskId, status, executionId };
    }
    fireCallback(callbackUrl, task, result, error) {
        try {
            const text = this.buildReply(task, result, error);
            fetch(callbackUrl + '&text=' + encodeURIComponent(text), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch((e) => console.error('Telegram callback error:', e?.message ?? String(e)));
        }
        catch (e) {
            console.error('Callback error:', e?.message ?? String(e));
        }
    }
    buildReply(task, result, error) {
        if (error)
            return `❌ Task failed: ${error}`;
        const intent = task.intent;
        if (intent === 'status' || intent === 'overview') {
            const app = (r) => `🚦 **AngelOS Status**\n\nPending approvals: ${r.pendingApprovals ?? '?'}\nNeeds attention: ${r.needsAttention ?? '?'}\n${this.listItems(r.pendingApprovalsItems ?? [], 'Approvals')}\n${this.listItems(r.attentionItems ?? [], 'Attention')}`;
            return app(result);
        }
        if (intent === 'build' || intent === 'fix' || intent === 'review') {
            const parts = ['🔨 **Hermes Build Result**'];
            if (result.files_changed?.length) {
                parts.push(`**Files (${result.files_changed.length}):**`);
                result.files_changed.slice(0, 10).forEach((f) => parts.push(`- \`${f}\``));
            }
            if (result.test_result)
                parts.push(`**Tests:** ${result.test_result.status}`);
            if (result.summary)
                parts.push(result.summary);
            if (result.error)
                parts.push(`**Error:** ${result.error}`);
            return parts.join('\n');
        }
        if (intent === 'blockers') {
            const bl = result.blockers ?? result.blockers_list ?? [];
            if (!bl.length)
                return '🚧 **Blockers:** No active blockers.';
            return '🚧 **Blockers:**\n' + bl.map((b) => `- ${b.description ?? 'No description'}`).join('\n');
        }
        if (intent === 'next' || intent === 'plan') {
            if (!result.goal)
                return JSON.stringify(result, null, 2);
            const parts = [`🎯 **Hermes Task**`, ``, `GOAL: ${result.goal}`];
            if (result.files?.length)
                parts.push(`FILES: ${result.files.join(', ')}`);
            if (result.area)
                parts.push(`AREA: ${result.area}`);
            if (result.build?.length) {
                parts.push(`BUILD:`);
                result.build.forEach((s, i) => parts.push(`  ${i + 1}. ${s}`));
            }
            return parts.join('\n');
        }
        return result.summary ?? JSON.stringify(result, null, 2);
    }
    listItems(items, label) {
        if (!items.length)
            return '';
        return `**${label}:**\n` + items.slice(0, 5).map((a) => {
            const name = a.clientName ?? a.title ?? a.content?.substring(0, 60) ?? '?';
            return `- ${name}`;
        }).join('\n') + (items.length > 5 ? `\n- ... and ${items.length - 5} more` : '');
    }
};
exports.N8nCallbackService = N8nCallbackService = __decorate([
    (0, common_1.Injectable)()
], N8nCallbackService);
//# sourceMappingURL=n8n-callback.service.js.map