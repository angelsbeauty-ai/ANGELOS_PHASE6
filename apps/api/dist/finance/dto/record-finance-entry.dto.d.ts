export declare class RecordFinanceEntryDto {
    clientId: string;
    appointmentId?: string;
    entryType: string;
    amount: number;
    currency?: string;
    method?: string;
    note?: string;
    occurredAt?: string;
    idempotencyKey?: string;
    correctionEffect?: string;
}
