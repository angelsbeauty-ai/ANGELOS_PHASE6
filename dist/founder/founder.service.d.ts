import type { AuthUser } from '../auth/auth-user';
import type { CreateStudentDiscountDto } from './dto/create-student-discount.dto';
import type { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
type SubscriptionOverviewRow = {
    workspace_id: string;
    status: string;
    billing_interval: string | null;
    discount_percent: number | null;
    trial_ends_at: string | null;
    read_only_until: string | null;
};
export declare class FounderService {
    me(user: AuthUser): Promise<{
        founder: boolean;
        userId: string;
        email: string | null;
    }>;
    overview(): Promise<{
        counts: {
            workspaces: number;
            trialing: number;
            active: number;
            readOnly: number;
            urgentAttention: number;
        };
        usage30d: {
            events: number;
            activeWorkspaces: number;
            topScreens: {
                views: number;
                durationMs: number;
                screen: string;
            }[];
        };
        featureFlags: any[];
    }>;
    workspaces(): Promise<{
        subscription: SubscriptionOverviewRow | null;
        attentionCount: number;
        id: string;
        name: string;
        business_type?: string | null;
        timezone?: string;
        currency?: string;
        created_at: string;
    }[]>;
    featureFlags(): Promise<any[]>;
    updateFeatureFlag(user: AuthUser, key: string, dto: UpdateFeatureFlagDto): Promise<any>;
    createStudentDiscount(user: AuthUser, dto: CreateStudentDiscountDto): Promise<{
        token: string;
        id: any;
        email_hint: any;
        discount_percent: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }>;
    listStudentDiscounts(): Promise<{
        id: any;
        email_hint: any;
        discount_percent: any;
        redeemed_workspace_id: any;
        redeemed_by: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }[]>;
    revokeStudentDiscount(id: string): Promise<{
        id: any;
        revoked_at: any;
    }>;
}
export {};
