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
exports.PublishingService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const publishing_adapter_registry_1 = require("./publishing-adapter.registry");
let PublishingService = exports.PublishingService = class PublishingService {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    async publishNow(user, workspaceId, variantId, platform) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: variant, error: variantError } = await supabase
            .from('content_variants')
            .select('*, post:content_posts(*)')
            .eq('workspace_id', workspaceId)
            .eq('id', variantId)
            .single();
        if (variantError || !variant)
            throw new common_1.NotFoundException('Content variant not found');
        const post = variant.post;
        if (!post)
            throw new common_1.NotFoundException('Content post not found');
        const resolvedPlatform = platform ?? variant.platform;
        const adapter = this.registry.resolve(resolvedPlatform);
        if (!adapter) {
            throw new common_1.InternalServerErrorException(`No publishing adapter registered for platform '${resolvedPlatform}'.`);
        }
        if (!['approved', 'scheduled', 'publishing'].includes(post.status)) {
            throw new common_1.InternalServerErrorException('Content must be approved before publishing');
        }
        if (!['approved', 'scheduled', 'publishing'].includes(variant.status)) {
            throw new common_1.InternalServerErrorException('This platform version is not approved for publishing');
        }
        const detail = await this.getDetail(supabase, workspaceId, post.id);
        const assets = detail?.media?.map((row) => row.asset).filter(Boolean) ?? [];
        const isMarketingEligible = (asset) => asset?.marketing_permission === 'eligible' &&
            asset?.is_upload_approved === true &&
            (!asset?.consent_required || asset?.consent_granted === true);
        if (assets.some((asset) => !isMarketingEligible(asset))) {
            throw new common_1.InternalServerErrorException('Publishing stopped because media permission changed after approval');
        }
        const idempotencyKey = `content:${variant.id}`;
        const { data: previous } = await service
            .from('content_publish_attempts')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();
        if (previous?.status === 'published') {
            return {
                variant,
                published: true,
                duplicatePrevented: true,
                verification: previous.verification,
            };
        }
        const now = new Date().toISOString();
        const attemptNo = Number(previous?.attempt_no ?? 0) + 1;
        if (previous) {
            await service
                .from('content_publish_attempts')
                .update({ status: 'publishing', attempt_no: attemptNo, error_message: null })
                .eq('workspace_id', workspaceId)
                .eq('id', previous.id);
        }
        else {
            await service
                .from('content_publish_attempts')
                .insert({
                workspace_id: workspaceId,
                content_variant_id: variant.id,
                idempotency_key: idempotencyKey,
                attempt_no: attemptNo,
                status: 'publishing',
            });
        }
        await service
            .from('content_posts')
            .update({ status: 'publishing', updated_at: now })
            .eq('id', post.id);
        await service
            .from('content_variants')
            .update({ status: 'publishing', updated_at: now })
            .eq('id', variant.id);
        const result = await adapter.publish({
            platform: resolvedPlatform,
            format: variant.format,
            caption: variant.caption,
            hook: variant.hook,
            cta: variant.cta,
            hashtags: variant.hashtags ?? [],
            scheduledFor: variant.scheduled_for,
            idempotencyKey,
        });
        if (result.status !== 'published') {
            await service
                .from('content_publish_attempts')
                .update({
                status: result.status === 'failed' ? 'failed' : 'unknown',
                provider_response: result.raw ?? null,
                error_message: result.error ?? null,
            })
                .eq('workspace_id', workspaceId)
                .eq('idempotency_key', idempotencyKey);
            await service
                .from('content_variants')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', variant.id);
            await service
                .from('content_posts')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', post.id);
            throw new common_1.InternalServerErrorException(result.error ?? 'Publishing could not be verified');
        }
        const publishedAt = new Date().toISOString();
        const verification = {
            verified: true,
            transport: resolvedPlatform,
            providerPostId: result.providerPostId,
            liveUrl: result.liveUrl,
            verifiedAt: publishedAt,
        };
        await service
            .from('content_publish_attempts')
            .update({
            status: 'published',
            provider_response: result.raw ?? null,
            verification,
            error_message: null,
        })
            .eq('workspace_id', workspaceId)
            .eq('idempotency_key', idempotencyKey);
        const { data: publishedVariant, error: updateError } = await service
            .from('content_variants')
            .update({
            status: 'published',
            provider_post_id: result.providerPostId,
            live_url: result.liveUrl,
            published_at: publishedAt,
            updated_at: publishedAt,
        })
            .eq('id', variant.id)
            .select('*')
            .single();
        if (updateError || !publishedVariant) {
            throw new common_1.InternalServerErrorException(updateError?.message ?? 'Could not finalize published content');
        }
        const { data: remaining } = await service
            .from('content_variants')
            .select('id,status')
            .eq('workspace_id', workspaceId)
            .eq('content_post_id', post.id)
            .neq('status', 'published')
            .neq('status', 'archived');
        if (!remaining?.length) {
            await service
                .from('content_posts')
                .update({ status: 'published', updated_at: publishedAt })
                .eq('id', post.id);
            const mediaIds = detail?.media?.map((row) => row.asset?.id).filter(Boolean) ?? [];
            if (mediaIds.length) {
                await service
                    .from('media_assets')
                    .update({ content_status: 'posted', updated_at: publishedAt })
                    .eq('workspace_id', workspaceId)
                    .in('id', mediaIds);
                await service
                    .from('media_usage_events')
                    .insert(mediaIds.map((mediaAssetId) => ({
                    workspace_id: workspaceId,
                    media_asset_id: mediaAssetId,
                    usage_type: 'content_published',
                    platform: resolvedPlatform,
                    reference_id: post.id,
                    created_by: user.id,
                })));
            }
        }
        else {
            const nextPostStatus = remaining.some((item) => item.status === 'scheduled')
                ? 'scheduled'
                : 'approved';
            await service
                .from('content_posts')
                .update({ status: nextPostStatus, updated_at: publishedAt })
                .eq('id', post.id);
        }
        return { variant: publishedVariant, published: true, duplicatePrevented: false, verification };
    }
    async getDetail(supabase, workspaceId, contentPostId) {
        const { data, error } = await supabase
            .from('content_posts')
            .select(`
        *,
        media:content_post_media(id,position,role,asset:media_assets(*))
      `)
            .eq('workspace_id', workspaceId)
            .eq('id', contentPostId)
            .single();
        if (error || !data)
            return null;
        return data;
    }
};
exports.PublishingService = PublishingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [publishing_adapter_registry_1.PublishingAdapterRegistry])
], PublishingService);
//# sourceMappingURL=publishing.service.js.map