import type { AuthUser } from '../auth/auth-user';
import { RecordFinanceEntryDto } from './dto/record-finance-entry.dto';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly finance;
    constructor(finance: FinanceService);
    overview(user: AuthUser, workspaceId: string, days?: string): Promise<{
        days: number;
        actualIncome: number;
        byMethod: Record<string, number>;
        entries: any[];
    }>;
    appointment(user: AuthUser, workspaceId: string, appointmentId: string): Promise<{
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
    record(user: AuthUser, workspaceId: string, dto: RecordFinanceEntryDto): Promise<{
        entry: any;
        duplicatePrevented: boolean;
    }>;
}
