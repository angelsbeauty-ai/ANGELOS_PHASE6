"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubAgentService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let SubAgentService = class SubAgentService {
    async createSubAgentTask(workspaceId, orchestratorTaskId, bot, subAgent, intent, taskDescription, requiresApproval) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_sub_agent_tasks')
            .insert({
            workspace_id: workspaceId,
            orchestrator_task_id: orchestratorTaskId,
            bot,
            sub_agent: subAgent,
            intent,
            task_description: taskDescription,
            status: requiresApproval ? 'awaiting_approval' : 'queued',
            requires_approval: requiresApproval,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create sub-agent task: ${error.message}`);
        return data;
    }
    async getSubAgentTask(taskId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_sub_agent_tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        if (error || !data)
            throw new common_1.BadRequestException('Sub-agent task not found');
        return data;
    }
    async updateSubAgentTaskStatus(taskId, updates) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_sub_agent_tasks')
            .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .eq('id', taskId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update sub-agent task: ${error.message}`);
        return data;
    }
    async listSubAgentTasks(workspaceId, limit = 50) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_sub_agent_tasks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.BadRequestException(`Failed to list sub-agent tasks: ${error.message}`);
        return (data ?? []);
    }
    async executeBotTask(taskId, simulationResult = {}) {
        const task = await this.getSubAgentTask(taskId);
        const confidence = 90;
        return this.updateSubAgentTaskStatus(taskId, {
            status: 'completed',
            result: simulationResult,
            confidence,
        });
    }
};
exports.SubAgentService = SubAgentService;
exports.SubAgentService = SubAgentService = __decorate([
    (0, common_1.Injectable)()
], SubAgentService);
//# sourceMappingURL=sub-agent.service.js.map