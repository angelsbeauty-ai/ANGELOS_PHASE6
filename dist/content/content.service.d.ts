import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from '../ai/ai-provider.service';
import type { CreateContentDraftDto } from './dto/create-content-draft.dto';
import type { ReviewContentMediaDto } from './dto/review-content-media.dto';
import type { UpdateContentVariantDto } from './dto/update-content-variant.dto';
import { PublishingService } from './publishing.service';
export declare class ContentService {
    private readonly aiProvider;
    private readonly publishing;
    constructor(aiProvider: AiProviderService, publishing: PublishingService);
    list(user: AuthUser, workspaceId: string): Promise<any[]>;
    get(user: AuthUser, workspaceId: string, contentPostId: string): Promise<any>;
    reviewMedia(user: AuthUser, workspaceId: string, dto: ReviewContentMediaDto): Promise<{
        total: any;
        eligible_count: any;
        eligible: any;
    }>;
    createDraft(user: AuthUser, workspaceId: string, dto: CreateContentDraftDto): Promise<any>;
    approve(user: AuthUser, workspaceId: string, contentPostId: string): Promise<any>;
    updateVariant(user: AuthUser, workspaceId: string, variantId: string, dto: UpdateContentVariantDto): Promise<any>;
    scheduleVariant(user: AuthUser, workspaceId: string, variantId: string, scheduledFor: string): Promise<any>;
    publishNow(user: AuthUser, workspaceId: string, variantId: string): Promise<{
        variant: any;
        published: boolean;
        duplicatePrevented: boolean;
        verification?: Record<string, any>;
    }>;
    getPublishStatus(user: AuthUser, workspaceId: string): Promise<{
        id: any;
        status: any;
        strategy_direction: any;
        updated_at: any;
        variants: {
            id: any;
            platform: any;
            status: any;
            scheduled_for: any;
            published_at: any;
        }[];
    }[]>;
    private getMediaAssets;
    private isMarketingEligible;
    private summarizeMedia;
}
