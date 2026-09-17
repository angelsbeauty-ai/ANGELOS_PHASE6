import type { AuthUser } from '../auth/auth-user';
import { CreateStudentDiscountDto } from './dto/create-student-discount.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FounderService } from './founder.service';
import { BetaService } from '../beta/beta.service';
import { CreateBetaInviteDto } from '../beta/dto/create-beta-invite.dto';
import { UpdateBetaFeedbackDto } from '../beta/dto/update-beta-feedback.dto';
export declare class FounderController {
    private readonly founder;
    private readonly beta;
    constructor(founder: FounderService, beta: BetaService);
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
        subscription: {
            workspace_id: string;
            status: string;
            billing_interval: string | null;
            discount_percent: number | null;
            trial_ends_at: string | null;
            read_only_until: string | null;
        } | null;
        attentionCount: number;
        id: string;
        name: string;
        business_type?: string | null;
        timezone?: string;
        currency?: string;
        created_at: string;
    }[]>;
    flags(): Promise<any[]>;
    updateFlag(user: AuthUser, key: string, dto: UpdateFeatureFlagDto): Promise<any>;
    betaOverview(): Promise<{
        release: any;
        counts: {
            approvedTesters: number;
            students: number;
            outsideBusinesses: number;
            activeOutside7d: number;
            activeOutside30d: number;
            feedback: number;
            testimonialCandidates: number;
            urgentOpen: number;
        };
        averageRating: number | null;
        criteria: {
            key: string;
            label: string;
            pass: boolean;
            current: number | null;
            target: number;
        }[];
        readiness: string;
        founderDecisionRequired: boolean;
    }>;
    betaInvites(): Promise<{
        id: any;
        email_hint: any;
        cohort: any;
        label: any;
        region: any;
        expires_at: any;
        redeemed_by: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }[]>;
    createBetaInvite(user: AuthUser, dto: CreateBetaInviteDto): Promise<{
        token: string;
        id: any;
        email_hint: any;
        cohort: any;
        label: any;
        region: any;
        expires_at: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }>;
    revokeBetaInvite(id: string): Promise<{
        id: any;
        revoked_at: any;
    }>;
    revokeBetaTester(userId: string): Promise<{
        user_id: any;
        workspace_id: any;
        cohort: any;
        revoked_at: any;
    } | {
        subscriptionDowngraded: boolean;
        user_id: any;
        workspace_id: any;
        cohort: any;
        revoked_at: any;
    }>;
    betaFeedback(): Promise<{
        id: any;
        workspace_id: any;
        category: any;
        message: any;
        rating: any;
        permission_to_contact: any;
        permission_to_quote: any;
        status: any;
        founder_note: any;
        created_at: any;
        updated_at: any;
    }[]>;
    updateBetaFeedback(id: string, dto: UpdateBetaFeedbackDto): Promise<any>;
    discounts(): Promise<{
        id: any;
        email_hint: any;
        discount_percent: any;
        redeemed_workspace_id: any;
        redeemed_by: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }[]>;
    createDiscount(user: AuthUser, dto: CreateStudentDiscountDto): Promise<{
        token: string;
        id: any;
        email_hint: any;
        discount_percent: any;
        redeemed_at: any;
        revoked_at: any;
        created_at: any;
    }>;
    revokeDiscount(id: string): Promise<{
        id: any;
        revoked_at: any;
    }>;
}
