import type { AuthUser } from '../auth/auth-user';
import { ContentService } from './content.service';
import { CreateContentDraftDto } from './dto/create-content-draft.dto';
import { ReviewContentMediaDto } from './dto/review-content-media.dto';
import { ScheduleContentVariantDto } from './dto/schedule-content-variant.dto';
import { UpdateContentVariantDto } from './dto/update-content-variant.dto';
export declare class ContentController {
    private readonly content;
    constructor(content: ContentService);
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
    scheduleVariant(user: AuthUser, workspaceId: string, variantId: string, dto: ScheduleContentVariantDto): Promise<any>;
    publishNow(user: AuthUser, workspaceId: string, variantId: string): Promise<{
        variant: any;
        published: boolean;
        duplicatePrevented: boolean;
        verification?: Record<string, any>;
    }>;
    publishStatus(user: AuthUser, workspaceId: string): Promise<{
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
}
