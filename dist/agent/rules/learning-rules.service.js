"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningRulesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let LearningRulesService = class LearningRulesService {
    async createRule(workspaceId, rule) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_learning_rules')
            .insert({
            ...rule,
            workspace_id: workspaceId,
            created_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to save rule: ${error.message}`);
        return data;
    }
    async getRules(workspaceId, scope, scopeValue) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        let query = supabase
            .from('agent_learning_rules')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('confirmed', true);
        if (scope)
            query = query.eq('scope', scope);
        if (scopeValue)
            query = query.eq('scope_value', scopeValue);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(`Failed to get rules: ${error.message}`);
        return (data ?? []);
    }
    async getRulesForBot(workspaceId, bot) {
        return this.getRules(workspaceId, 'bot', bot);
    }
    async getRulesForScope(workspaceId, scope, scopeValue) {
        return this.getRules(workspaceId, scope, scopeValue);
    }
    async proposeRule(workspaceId, ruleText, scope, scopeValue, source = 'user_correction') {
        return this.createRule(workspaceId, {
            scope,
            scope_value: scopeValue,
            rule_text: ruleText,
            source,
            confirmed: false,
        });
    }
    async confirmRule(ruleId, confirmedBy) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await supabase
            .from('agent_learning_rules')
            .update({
            confirmed: true,
            confirmed_by: confirmedBy,
            updated_at: new Date().toISOString(),
        })
            .eq('id', ruleId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to confirm rule: ${error.message}`);
        return data;
    }
    async rejectRule(ruleId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { error } = await supabase
            .from('agent_learning_rules')
            .delete()
            .eq('id', ruleId);
        if (error)
            throw new common_1.BadRequestException(`Failed to reject rule: ${error.message}`);
    }
    async getApplicableRules(workspaceId, bot, intent) {
        const rules = await this.getRulesForBot(workspaceId, bot);
        return rules.map((r) => r.rule_text);
    }
};
exports.LearningRulesService = LearningRulesService;
exports.LearningRulesService = LearningRulesService = __decorate([
    (0, common_1.Injectable)()
], LearningRulesService);
//# sourceMappingURL=learning-rules.service.js.map