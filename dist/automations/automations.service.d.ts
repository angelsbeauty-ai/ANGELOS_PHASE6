import type { AuthUser } from '../auth/auth-user';
import type { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
export declare class AutomationsService {
    seedDefaults(user: AuthUser, workspaceId: string): Promise<any[]>;
    listRules(user: AuthUser, workspaceId: string): Promise<any[]>;
    updateRule(user: AuthUser, workspaceId: string, ruleId: string, dto: UpdateAutomationRuleDto): Promise<any>;
    listJobs(user: AuthUser, workspaceId: string): Promise<any[]>;
    queueForAppointmentEvent(user: AuthUser, workspaceId: string, appointmentId: string, triggerType: 'appointment_confirmed' | 'appointment_completed'): Promise<any[]>;
    handleTreatmentRecorded(user: AuthUser, workspaceId: string, clientId: string, treatmentData: Record<string, unknown>): Promise<{
        client: {
            id: any;
            display_name: any;
        };
        jobs: any[];
    }>;
    cancelAppointmentJobs(user: AuthUser, workspaceId: string, appointmentId: string): Promise<void>;
    processDue(user: AuthUser, workspaceId: string, limit?: number): Promise<any[]>;
    private runOne;
    private finishJob;
}
