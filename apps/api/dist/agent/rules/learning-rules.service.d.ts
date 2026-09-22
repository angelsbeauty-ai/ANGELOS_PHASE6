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
export declare class LearningRulesService {
    createRule(workspaceId: string, rule: Omit<LearningRule, 'id' | 'created_at'>): Promise<LearningRule>;
    getRules(workspaceId: string, scope?: string, scopeValue?: string): Promise<LearningRule[]>;
    getRulesForBot(workspaceId: string, bot: string): Promise<LearningRule[]>;
    getRulesForScope(workspaceId: string, scope: string, scopeValue: string): Promise<LearningRule[]>;
    proposeRule(workspaceId: string, ruleText: string, scope: LearningRule['scope'], scopeValue?: string, source?: LearningRule['source']): Promise<LearningRule>;
    confirmRule(ruleId: string, confirmedBy: string): Promise<LearningRule>;
    rejectRule(ruleId: string): Promise<void>;
    getApplicableRules(workspaceId: string, bot: string, intent: string): Promise<string[]>;
}
