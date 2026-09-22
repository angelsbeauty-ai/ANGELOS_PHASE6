import type { AuthUser } from '../auth/auth-user';
import type { RecordFinanceEntryDto } from './dto/record-finance-entry.dto';
export declare class FinanceService {
    recordEntry(user: AuthUser, workspaceId: string, dto: RecordFinanceEntryDto): Promise<{
        entry: any;
        duplicatePrevented: boolean;
    }>;
    appointmentSummary(user: AuthUser, workspaceId: string, appointmentId: string): Promise<{
        expectedTotal: number;
        discounts: number;
        actualReceived: number;
        refunds: number;
        amountDue: number;
        requiresOwnerConfirmationBeforeClientReminder: boolean;
        appointment: {
            id: any;
            client_id: any;
            service_name: any;
            price_snapshot: any;
            currency: any;
            status: any;
            start_at: any;
        };
        entries: any[];
    }>;
    overview(user: AuthUser, workspaceId: string, days?: number): Promise<{
        days: number;
        actualIncome: number;
        byMethod: Record<string, number>;
        entries: any[];
    }>;
}
