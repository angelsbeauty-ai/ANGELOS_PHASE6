import type { AuthUser } from '../auth/auth-user';
import type { CreateBetaInviteDto } from './dto/create-beta-invite.dto';
import type { RedeemBetaInviteDto } from './dto/redeem-beta-invite.dto';
import type { SubmitBetaFeedbackDto } from './dto/submit-beta-feedback.dto';
import type { UpdateBetaFeedbackDto } from './dto/update-beta-feedback.dto';
export declare class BetaService {
    private isFounder;
    me(user: AuthUser): Promise<{
        approved: boolean;
        founderBypass: boolean;
        cohort: string;
        workspaceId: null;
        approvedAt?: undefined;
    } | {
        approved: boolean;
        founderBypass: boolean;
        cohort: any;
        approvedAt: any;
        workspaceId: any;
    }>;
    ensureCanCreateWorkspace(user: AuthUser): Promise<void>;
    redeem(user: AuthUser, dto: RedeemBetaInviteDto): Promise<any>;
    submitFeedback(user: AuthUser, workspaceId: string, dto: SubmitBetaFeedbackDto): Promise<{
        id: any;
        category: any;
        rating: any;
        permission_to_contact: any;
        permission_to_quote: any;
        status: any;
        created_at: any;
    }>;
    createInvite(user: AuthUser, dto: CreateBetaInviteDto): Promise<{
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
    listInvites(): Promise<{
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
    revokeInvite(id: string): Promise<{
        id: any;
        revoked_at: any;
    }>;
    revokeTester(userId: string): Promise<{
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
    listFeedback(): Promise<{
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
    updateFeedback(id: string, dto: UpdateBetaFeedbackDto): Promise<any>;
    overview(): Promise<{
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
}
