import type { AuthUser } from '../auth/auth-user';
import { BetaService } from './beta.service';
import { RedeemBetaInviteDto } from './dto/redeem-beta-invite.dto';
import { SubmitBetaFeedbackDto } from './dto/submit-beta-feedback.dto';
export declare class BetaController {
    private readonly beta;
    constructor(beta: BetaService);
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
    redeem(user: AuthUser, dto: RedeemBetaInviteDto): Promise<any>;
    feedback(user: AuthUser, workspaceId: string, dto: SubmitBetaFeedbackDto): Promise<{
        id: any;
        category: any;
        rating: any;
        permission_to_contact: any;
        permission_to_quote: any;
        status: any;
        created_at: any;
    }>;
}
