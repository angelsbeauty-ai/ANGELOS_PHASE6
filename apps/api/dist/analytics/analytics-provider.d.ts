export interface NormalizedContentMetrics {
    reach?: number;
    impressions?: number;
    views?: number;
    watchTimeSeconds?: number;
    averageWatchTimeSeconds?: number;
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
    profileVisits?: number;
    linkClicks?: number;
    dms?: number;
    inquiries?: number;
    bookings?: number;
    revenue?: number;
    currency?: string;
    completionRate?: number;
    rawMetrics?: Record<string, unknown>;
}
export interface NormalizedAudienceActivity {
    dayOfWeek: number;
    hourLocal: number;
    activeFollowers: number;
    rawMetrics?: Record<string, unknown>;
}
export interface PlatformAnalyticsAdapter {
    platform: 'instagram' | 'facebook' | 'tiktok';
    fetchContentMetrics(providerPostId: string): Promise<NormalizedContentMetrics | null>;
    fetchAudienceActivity(): Promise<NormalizedAudienceActivity[]>;
}
export declare class UnavailableAnalyticsAdapter implements PlatformAnalyticsAdapter {
    readonly platform: 'instagram' | 'facebook' | 'tiktok';
    constructor(platform: 'instagram' | 'facebook' | 'tiktok');
    fetchContentMetrics(): Promise<null>;
    fetchAudienceActivity(): Promise<NormalizedAudienceActivity[]>;
}
