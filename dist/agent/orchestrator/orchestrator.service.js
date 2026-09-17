"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let OrchestratorService = class OrchestratorService {
    async createTask(workspaceId, userMessage, intent, requiresApproval) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_orchestrator_tasks')
            .insert({
            workspace_id: workspaceId,
            user_message: userMessage,
            intent,
            requires_approval: requiresApproval,
            status: requiresApproval ? 'awaiting_approval' : 'queued',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create orchestrator task: ${error.message}`);
        return data;
    }
    async assignTask(taskId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data: task } = await supabase
            .from('agent_orchestrator_tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        if (!task)
            throw new common_1.BadRequestException('Task not found');
        const assignment = this.routeToBot(task.intent, task.user_message);
        await supabase
            .from('agent_orchestrator_tasks')
            .update({
            status: 'assigned',
            assigned_bot: assignment.bot,
            assigned_sub_agent: assignment.subAgent,
            updated_at: new Date().toISOString(),
        })
            .eq('id', taskId);
        return assignment;
    }
    routeToBot(intent, message) {
        const lower = message.toLowerCase();
        if (/build|code|fix|develop|program|implement|test|release|debug|deploy|create (app|feature|page|component|api|endpoint|service|controller|module)/i.test(lower)) {
            return { taskId: '', bot: 'angelos', subAgent: 'angelos-dev', reasoning: 'Development-related request — routed to AngelOS bot' };
        }
        if (/client|customer|inquiry|lead|booking|appointment|schedule|beauty|service|follow.up|esthetic|spa|salon/i.test(lower)) {
            return { taskId: '', bot: 'angels_beauty', subAgent: 'angels-beauty-crm', reasoning: 'Beauty business-related request — routed to Angels Beauty bot' };
        }
        if (/student|course|lesson|academy|class|enrollment|education|learn|teach|training|module|curriculum/i.test(lower)) {
            return { taskId: '', bot: 'academy', subAgent: 'academy-students', reasoning: 'Academy-related request — routed to Academy bot' };
        }
        if (/marketing|post|content|social|audience|growth|campaign|publish|analytics|metrics|performance|seo|hashtag/i.test(lower)) {
            return { taskId: '', bot: 'general', subAgent: 'marketing', reasoning: 'Marketing-related request — routed to marketing capability' };
        }
        return { taskId: '', bot: 'general', subAgent: 'general', reasoning: 'General request — routed to general capability' };
    }
    async getTask(taskId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_orchestrator_tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        if (error || !data)
            throw new common_1.BadRequestException('Task not found');
        return data;
    }
    async updateTaskStatus(taskId, updates) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_orchestrator_tasks')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', taskId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update task: ${error.message}`);
        return data;
    }
    async listTasks(workspaceId, limit = 50) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_orchestrator_tasks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.BadRequestException(`Failed to list tasks: ${error.message}`);
        return (data ?? []);
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = __decorate([
    (0, common_1.Injectable)()
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map