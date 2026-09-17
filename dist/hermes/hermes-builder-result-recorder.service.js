"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesBuilderResultRecorder = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let HermesBuilderResultRecorder = class HermesBuilderResultRecorder {
    async recordResult(taskId, executionId, result, error) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const status = error ? 'failed' : 'done';
        const now = new Date().toISOString();
        let serializedResult;
        try {
            serializedResult = JSON.parse(JSON.stringify(result));
        }
        catch {
            serializedResult = { raw: String(result) };
        }
        const values = {
            status,
            hermes_result: serializedResult,
            hermes_error: error ?? null,
            n8n_execution_id: executionId,
            n8n_status: status,
            updated_at: now
        };
        const { error: updateError } = await supabase
            .from('hermes_tasks')
            .update(values)
            .eq('id', taskId);
        if (updateError) {
            return { success: false, taskId, error: updateError.message };
        }
        const { data: task } = await supabase
            .from('hermes_tasks')
            .select('n8n_callback_url, source_channel')
            .eq('id', taskId)
            .single();
        if (task?.n8n_callback_url && task.source_channel === 'telegram') {
            this.fireCallback(task.n8n_callback_url, result, error);
        }
        return { success: true, taskId, status };
    }
    fireCallback(callbackUrl, result, error) {
        const text = error
            ? `❌ Hermes task failed: ${error}`
            : `✅ Hermes task completed. Result recorded.`;
        fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, result, error })
        }).catch(() => { });
    }
};
exports.HermesBuilderResultRecorder = HermesBuilderResultRecorder;
exports.HermesBuilderResultRecorder = HermesBuilderResultRecorder = __decorate([
    (0, common_1.Injectable)()
], HermesBuilderResultRecorder);
//# sourceMappingURL=hermes-builder-result-recorder.service.js.map