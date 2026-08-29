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

/**
 * Sprint 8 intentionally does not pretend a social analytics connection exists.
 * Real provider adapters will implement this interface after OAuth/scopes/capability checks.
 */
export class UnavailableAnalyticsAdapter implements PlatformAnalyticsAdapter {
  constructor(public readonly platform: 'instagram' | 'facebook' | 'tiktok') {}

  async fetchContentMetrics(): Promise<null> {
    return null;
  }

  async fetchAudienceActivity(): Promise<NormalizedAudienceActivity[]> {
    return [];
  }
}
