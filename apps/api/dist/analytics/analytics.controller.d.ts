import type { AuthUser } from '../auth/auth-user';
import { AnalyticsService } from './analytics.service';
import { RecordAudienceActivityDto } from './dto/record-audience-activity.dto';
import { RecordContentMetricsDto } from './dto/record-content-metrics.dto';
import { UpdateMarketingProfileDto } from './dto/update-marketing-profile.dto';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    overview(user: AuthUser, workspaceId: string, days?: string): Promise<{
        period: {
            days: number;
            start: string;
            end: string;
        };
        workspace: {
            id: any;
            name: any;
            timezone: any;
            currency: any;
        };
        profile: any;
        operatingCosts: {
            planPrice: {
                amountCents: number;
                currency: any;
                interval: any;
                status: any;
            } | null;
            actualTotal: null;
            ai: null;
            messaging: null;
            hosting: null;
            explanation: string;
        };
        totals: Record<string, number | null>;
        topPost: {
            variantId: any;
            contentPostId: any;
            title: any;
            objective: any;
            platform: any;
            format: any;
            publishedAt: any;
            businessScore: string;
            metrics: Record<string, string | number | null> | null;
        } | null;
        strongestByGoal: Record<string, any>;
        postingWindow: {
            source: string;
            confidence: string;
            platform: string;
            dayOfWeek: number;
            hourLocal: number;
            label: string;
            message?: undefined;
        } | {
            source: string;
            confidence: string;
            platform: null;
            dayOfWeek: number;
            hourLocal: number;
            label: string;
            message?: undefined;
        } | {
            source: string;
            confidence: string;
            platform: null;
            dayOfWeek: null;
            hourLocal: null;
            label: null;
            message: string;
        };
        patterns: {
            byFormat: {
                averageBusinessScore: number;
                count: number;
                score: number;
                bookings: number;
                inquiries: number;
                saves: number;
                profileVisits: number;
                key: string;
            }[];
            byPlatform: {
                averageBusinessScore: number;
                count: number;
                score: number;
                bookings: number;
                inquiries: number;
                saves: number;
                profileVisits: number;
                key: string;
            }[];
            byObjective: {
                averageBusinessScore: number;
                count: number;
                score: number;
                bookings: number;
                inquiries: number;
                saves: number;
                profileVisits: number;
                key: string;
            }[];
        };
        evidence: {
            publishedVariants: number;
            measuredVariants: number;
            audienceActivitySamples: number;
            ownedDataConfidence: "low" | "medium" | "high";
            localContext: {
                enabled: any;
                serviceArea: any;
                city: any;
                region: any;
                country: any;
                liveLocalResearchConnected: boolean;
            };
        };
        recentPosts: {
            variantId: any;
            contentPostId: any;
            title: any;
            objective: any;
            platform: any;
            format: any;
            publishedAt: any;
            businessScore: string;
            metrics: Record<string, string | number | null> | null;
        }[];
    }>;
    getMarketingProfile(user: AuthUser, workspaceId: string): Promise<any>;
    updateMarketingProfile(user: AuthUser, workspaceId: string, dto: UpdateMarketingProfileDto): Promise<any>;
    recordContentMetrics(user: AuthUser, workspaceId: string, variantId: string, dto: RecordContentMetricsDto): Promise<any>;
    recordAudienceActivity(user: AuthUser, workspaceId: string, dto: RecordAudienceActivityDto): Promise<any>;
    marketingCoach(user: AuthUser, workspaceId: string, days?: string): Promise<{
        recommendation: string;
        confidence: "low" | "medium" | "high";
        provider: string;
        model: string;
        evidence: {
            period: {
                days: number;
                start: string;
                end: string;
            };
            workspace: {
                id: any;
                name: any;
                timezone: any;
                currency: any;
            };
            profile: any;
            operatingCosts: {
                planPrice: {
                    amountCents: number;
                    currency: any;
                    interval: any;
                    status: any;
                } | null;
                actualTotal: null;
                ai: null;
                messaging: null;
                hosting: null;
                explanation: string;
            };
            totals: Record<string, number | null>;
            topPost: {
                variantId: any;
                contentPostId: any;
                title: any;
                objective: any;
                platform: any;
                format: any;
                publishedAt: any;
                businessScore: string;
                metrics: Record<string, string | number | null> | null;
            } | null;
            strongestByGoal: Record<string, any>;
            postingWindow: {
                source: string;
                confidence: string;
                platform: string;
                dayOfWeek: number;
                hourLocal: number;
                label: string;
                message?: undefined;
            } | {
                source: string;
                confidence: string;
                platform: null;
                dayOfWeek: number;
                hourLocal: number;
                label: string;
                message?: undefined;
            } | {
                source: string;
                confidence: string;
                platform: null;
                dayOfWeek: null;
                hourLocal: null;
                label: null;
                message: string;
            };
            patterns: {
                byFormat: {
                    averageBusinessScore: number;
                    count: number;
                    score: number;
                    bookings: number;
                    inquiries: number;
                    saves: number;
                    profileVisits: number;
                    key: string;
                }[];
                byPlatform: {
                    averageBusinessScore: number;
                    count: number;
                    score: number;
                    bookings: number;
                    inquiries: number;
                    saves: number;
                    profileVisits: number;
                    key: string;
                }[];
                byObjective: {
                    averageBusinessScore: number;
                    count: number;
                    score: number;
                    bookings: number;
                    inquiries: number;
                    saves: number;
                    profileVisits: number;
                    key: string;
                }[];
            };
            evidence: {
                publishedVariants: number;
                measuredVariants: number;
                audienceActivitySamples: number;
                ownedDataConfidence: "low" | "medium" | "high";
                localContext: {
                    enabled: any;
                    serviceArea: any;
                    city: any;
                    region: any;
                    country: any;
                    liveLocalResearchConnected: boolean;
                };
            };
            recentPosts: {
                variantId: any;
                contentPostId: any;
                title: any;
                objective: any;
                platform: any;
                format: any;
                publishedAt: any;
                businessScore: string;
                metrics: Record<string, string | number | null> | null;
            }[];
        };
    }>;
}
