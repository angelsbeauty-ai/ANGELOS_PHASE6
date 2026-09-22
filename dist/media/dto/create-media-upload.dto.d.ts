export declare class CreateMediaUploadDto {
    filename: string;
    mimeType: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    durationMs?: number;
    source?: string;
    capturedAt?: string;
    clientId?: string;
    appointmentId?: string;
    treatmentRecordId?: string;
    role?: string;
    marketingPermission?: string;
    marketingScope?: Record<string, unknown>;
}
