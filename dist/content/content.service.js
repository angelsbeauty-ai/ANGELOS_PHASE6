"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_service_1 = require("../ai/ai-provider.service");
const supabase_1 = require("../config/supabase");
const publishing_service_1 = require("./publishing.service");
let ContentService = class ContentService {
    aiProvider;
    publishing;
    constructor(aiProvider, publishing) {
        this.aiProvider = aiProvider;
        this.publishing = publishing;
    }
    async list(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('content_posts')
            .select('*,media:content_post_media(id,position,role,asset:media_assets(id,original_filename,media_type,content_status,marketing_permission)),variants:content_variants(*)')
            .eq('workspace_id', workspaceId)
            .order('updated_at', { ascending: false })
            .limit(100);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async get(user, workspaceId, contentPostId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('content_posts')
            .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
            .eq('workspace_id', workspaceId)
            .eq('id', contentPostId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Content post not found');
        return data;
    }
    async reviewMedia(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const mediaAssets = await this.getMediaAssets(supabase, workspaceId);
        const eligible = mediaAssets.filter((asset) => this.isMarketingEligible(asset));
        return { total: mediaAssets.length, eligible_count: eligible.length, eligible };
    }
    async createDraft(user, workspaceId, dto) {
        const now = new Date().toISOString();
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const platformVariants = dto.platforms.map((platform) => ({
            platform,
            caption: '',
            status: 'draft',
            capabilities_snapshot: platform === 'manual' ? { demo: true, publish: true } : { connected: false, publish: false, sprint: 7 },
        }));
        const { data: post, error: postError } = await service
            .from('content_posts')
            .insert({
            workspace_id: workspaceId,
            status: 'draft',
            objective: dto.objective,
            goal: dto.goal ?? null,
            strategy_direction: null,
            editing_instructions: null,
            created_by: user.id,
            created_at: now,
        })
            .select()
            .single();
        if (postError || !post)
            throw new common_1.InternalServerErrorException(postError?.message ?? 'Could not create content post');
        for (const variant of platformVariants) {
            await service.from('content_variants').insert({
                content_post_id: post.id,
                workspace_id: workspaceId,
                platform: variant.platform,
                caption: variant.caption,
                status: variant.status,
                capabilities_snapshot: variant.capabilities_snapshot,
                created_by: user.id,
                created_at: now,
            });
        }
        if (dto.mediaAssetIds?.length) {
            await service.from('content_post_media').insert(dto.mediaAssetIds.map((mediaId, position) => ({
                content_post_id: post.id,
                workspace_id: workspaceId,
                media_asset_id: mediaId,
                position,
                role: 'primary',
                created_by: user.id,
            })));
        }
        const { data: fullPost } = await service
            .from('content_posts')
            .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
            .eq('id', post.id)
            .single();
        return fullPost;
    }
    async approve(user, workspaceId, contentPostId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: detail, error } = await supabase
            .from('content_posts')
            .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
            .eq('workspace_id', workspaceId)
            .eq('id', contentPostId)
            .single();
        if (error || !detail)
            throw new common_1.NotFoundException('Content post not found');
        if (detail.status !== 'draft')
            throw new common_1.ConflictException('Only draft content can be approved');
        if (!detail.variants?.length)
            throw new common_1.BadRequestException('Content post has no platform variants');
        if (detail.variants.some((variant) => !variant.caption?.trim())) {
            throw new common_1.BadRequestException('Every platform variant needs a caption before approval');
        }
        const mediaSummary = this.summarizeMedia(detail.media ?? []);
        const postResult = await this.aiProvider.generate({
            instructions: 'Generate a short content strategy direction based on the objective, goal, format, platforms, and available media.',
            input: `CONTENT_STRATEGY\nObjective=${detail.objective}\nGoal=${detail.goal ?? ''}\nFormat=${detail.variants?.[0]?.format ?? 'unknown'}\nPlatforms=${detail.variants?.map((v) => v.platform).join(',')}\nMedia=${JSON.stringify(mediaSummary)}`,
        });
        const strategyDirection = postResult?.text?.trim() ?? null;
        const { data: updated, error: updateError } = await supabase
            .from('content_posts')
            .update({
            status: 'prepared',
            strategy_direction: strategyDirection,
            editing_instructions: null,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        })
            .eq('id', contentPostId)
            .select()
            .single();
        if (updateError || !updated)
            throw new common_1.InternalServerErrorException(updateError?.message ?? 'Could not approve content');
        return updated;
    }
    async updateVariant(user, workspaceId, variantId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: variant, error } = await supabase
            .from('content_variants')
            .select('*,post:content_posts(*)')
            .eq('workspace_id', workspaceId)
            .eq('id', variantId)
            .single();
        if (error || !variant)
            throw new common_1.NotFoundException('Content variant not found');
        if (variant.status !== 'draft' && variant.status !== 'prepared') {
            throw new common_1.ConflictException('Only draft or prepared variants can be edited');
        }
        const updates = { updated_at: new Date().toISOString(), updated_by: user.id };
        if (dto.caption !== undefined)
            updates.caption = dto.caption;
        if (dto.hook !== undefined)
            updates.hook = dto.hook;
        if (dto.cta !== undefined)
            updates.cta = dto.cta;
        if (dto.hashtags !== undefined)
            updates.hashtags = dto.hashtags;
        const { data: updated } = await supabase
            .from('content_variants')
            .update(updates)
            .eq('id', variantId)
            .select()
            .single();
        if (error || !updated)
            throw new common_1.InternalServerErrorException('Could not update variant');
        return updated;
    }
    async scheduleVariant(user, workspaceId, variantId, scheduledFor) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: variant, error } = await supabase
            .from('content_variants')
            .select('*,post:content_posts(*)')
            .eq('workspace_id', workspaceId)
            .eq('id', variantId)
            .single();
        if (error || !variant)
            throw new common_1.NotFoundException('Content variant not found');
        if (!['prepared', 'approved'].includes(variant.status)) {
            throw new common_1.ConflictException('Only prepared or approved variants can be scheduled');
        }
        const { data: updated } = await supabase
            .from('content_variants')
            .update({
            scheduled_for: scheduledFor,
            status: 'scheduled',
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        })
            .eq('id', variantId)
            .select()
            .single();
        if (error || !updated)
            throw new common_1.InternalServerErrorException('Could not schedule variant');
        return updated;
    }
    async publishNow(user, workspaceId, variantId) {
        return this.publishing.publishNow(user, workspaceId, variantId);
    }
    async getPublishStatus(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('content_posts')
            .select('id,status,strategy_direction,updated_at,variants:content_variants(id,platform,status,scheduled_for,published_at)')
            .eq('workspace_id', workspaceId)
            .order('updated_at', { ascending: false })
            .limit(50);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    getMediaAssets(supabase, workspaceId) {
        return supabase.from('media_assets').select('*').eq('workspace_id', workspaceId).eq('is_upload_approved', true).neq('marketing_permission', 'revoked');
    }
    isMarketingEligible(asset) {
        return asset?.marketing_permission === 'eligible' &&
            asset?.is_upload_approved === true &&
            (!asset?.consent_required || asset?.consent_granted === true);
    }
    summarizeMedia(media) {
        return media.slice(0, 8).map((m) => ({
            id: m.asset?.id,
            filename: m.asset?.original_filename,
            media_type: m.asset?.media_type,
            role: m.role,
            marketing_permission: m.asset?.marketing_permission,
        }));
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_provider_service_1.AiProviderService,
        publishing_service_1.PublishingService])
], ContentService);
//# sourceMappingURL=content.service.js.map