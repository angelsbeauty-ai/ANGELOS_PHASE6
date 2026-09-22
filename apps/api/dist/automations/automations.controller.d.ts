import type { AuthUser } from '../auth/auth-user';
import { AutomationsService } from './automations.service';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
export declare class AutomationsController {
    private readonly automations;
    constructor(automations: AutomationsService);
    seed(user: AuthUser, workspaceId: string): Promise<any[]>;
    rules(user: AuthUser, workspaceId: string): Promise<any[]>;
    updateRule(user: AuthUser, workspaceId: string, ruleId: string, dto: UpdateAutomationRuleDto): Promise<any>;
    jobs(user: AuthUser, workspaceId: string): Promise<any[]>;
    process(user: AuthUser, workspaceId: string, limit?: string): Promise<any[]>;
}
