export declare class CreateAppointmentDto {
    idempotencyKey?: string;
    clientId: string;
    serviceId: string;
    startAt: string;
    source?: string;
    notes?: string;
    overrideSoftConflict?: boolean;
}
