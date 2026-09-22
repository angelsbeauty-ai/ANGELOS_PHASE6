import { Injectable, BadRequestException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../../config/supabase';

export interface LearningRule {
  id?: string;
  workspace_id?: string;
  scope: 'global' | 'angels_beauty' | 'academy' | 'angelos' | 'capability' | 'bot';
  scope_value?: string;
  rule_text: string;
  source: 'user_correction' | 'system' | 'manual';
  confirmed: boolean;
  confirmed_by?: string;
  created_at?: string;
  expires_at?: string;
}

@Injectable()
export class LearningRulesService {
  async createRule(
    workspaceId: string,
    rule: Omit<LearningRule, 'id' | 'created_at'>,
  ): Promise<LearningRule> {
    const supabase = createServiceSupabaseClient();

    const { data, error } = await supabase
      .from('agent_learning_rules')
      .insert({
        ...rule,
        workspace_id: workspaceId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to save rule: ${error.message}`);
    return data;
  }

  async getRules(workspaceId: string, scope?: string, scopeValue?: string): Promise<LearningRule[]> {
    const supabase = createServiceSupabaseClient();

    let query = supabase
      .from('agent_learning_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('confirmed', true);

    if (scope) query = query.eq('scope', scope);
    if (scopeValue) query = query.eq('scope_value', scopeValue);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new BadRequestException(`Failed to get rules: ${error.message}`);
    return (data ?? []) as LearningRule[];
  }

  async getRulesForBot(workspaceId: string, bot: string): Promise<LearningRule[]> {
    return this.getRules(workspaceId, 'bot', bot);
  }

  async getRulesForScope(workspaceId: string, scope: string, scopeValue: string): Promise<LearningRule[]> {
    return this.getRules(workspaceId, scope, scopeValue);
  }

  async proposeRule(
    workspaceId: string,
    ruleText: string,
    scope: LearningRule['scope'],
    scopeValue?: string,
    source: LearningRule['source'] = 'user_correction',
  ): Promise<LearningRule> {
    // PHASE 1: Create rule as unconfirmed — user must confirm
    return this.createRule(workspaceId, {
      scope,
      scope_value: scopeValue,
      rule_text: ruleText,
      source,
      confirmed: false,
    });
  }

  async confirmRule(ruleId: string, confirmedBy: string): Promise<LearningRule> {
    const supabase = createServiceSupabaseClient();
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

    if (error) throw new BadRequestException(`Failed to confirm rule: ${error.message}`);
    return data;
  }

  async rejectRule(ruleId: string): Promise<void> {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from('agent_learning_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw new BadRequestException(`Failed to reject rule: ${error.message}`);
  }

  async getApplicableRules(workspaceId: string, bot: string, intent: string): Promise<string[]> {
    const rules = await this.getRulesForBot(workspaceId, bot);
    return rules.map((r) => r.rule_text);
  }
}
