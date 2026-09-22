export declare class RecordAudienceActivityDto {
    platform: 'instagram' | 'facebook' | 'tiktok' | 'manual';
    dayOfWeek: number;
    hourLocal: number;
    activeFollowers: number;
    rawMetrics?: Record<string, unknown>;
}
