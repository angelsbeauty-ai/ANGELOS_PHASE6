import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createUserSupabaseClient, createServiceSupabaseClient } from '../config/supabase';
import { PublishingAdapterRegistry } from './publishing-adapter.registry';
import type { AuthUser } from '../auth/auth-user';

@Injectable()
export class PublishingService {
  constructor(private readonly registry: PublishingAdapterRegistry) {}

  async publishNow(
    user: AuthUser,
    workspaceId: string,
    variantId: string,
    platform?: string
  ): Promise<{
    variant: any;
    published: boolean;
    duplicatePrevented: boolean;
    verification?: Record<string, any>;
  }> {
    const supabase = createUserSupabaseClient(user.accessToken);
    const service = createServiceSupabaseClient();

    // Resolve the variant and its post
    const { data: variant, error: variantError } = await supabase
      .from('content_variants')
      .select('*, post:content_posts(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', variantId)
      .single();

    if (variantError || !variant) throw new NotFoundException('Content variant not found');
    const post = (variant as any).post;
    if (!post) throw new NotFoundException('Content post not found');

    // Determine platform: use passed platform, or variant's platform
    const resolvedPlatform = platform ?? variant.platform;

    // Resolve adapter from registry
    const adapter = this.registry.resolve(resolvedPlatform);
    if (!adapter) {
      throw new InternalServerErrorException(`No publishing adapter registered for platform '${resolvedPlatform}'.`);
    }

    // Validate post status
    if (!['approved', 'scheduled', 'publishing'].includes(post.status)) {
      throw new InternalServerErrorException('Content must be approved before publishing');
    }
    if (!['approved', 'scheduled', 'publishing'].includes(variant.status)) {
      throw new InternalServerErrorException('This platform version is not approved for publishing');
    }

    // Re-check marketing permission at publish time (same pattern as ContentService.publishNow)
    const detail = await this.getDetail(supabase, workspaceId, post.id);
    const assets = detail?.media?.map((row: any) => row.asset).filter(Boolean) ?? [];
    const isMarketingEligible = (asset: any) =>
      asset?.marketing_permission === 'eligible' &&
      asset?.is_upload_approved === true &&
      (!asset?.consent_required || asset?.consent_granted === true);

    if (assets.some((asset: any) => !isMarketingEligible(asset))) {
      throw new InternalServerErrorException('Publishing stopped because media permission changed after approval');
    }

    // Idempotency check (same pattern as ContentService.publishNow)
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

    // Record attempt as 'publishing'
    const now = new Date().toISOString();
    const attemptNo = Number(previous?.attempt_no ?? 0) + 1;

    if (previous) {
      await service
        .from('content_publish_attempts')
        .update({ status: 'publishing', attempt_no: attemptNo, error_message: null })
        .eq('workspace_id', workspaceId)
        .eq('id', previous.id);
    } else {
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

    // Call the adapter
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

      throw new InternalServerErrorException(result.error ?? 'Publishing could not be verified');
    }

    // Success — finalize
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
      throw new InternalServerErrorException(updateError?.message ?? 'Could not finalize published content');
    }

    // Check if all variants are published — if so, mark post as published
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

      const mediaIds = detail?.media?.map((row: any) => row.asset?.id).filter(Boolean) ?? [];
      if (mediaIds.length) {
        await service
          .from('media_assets')
          .update({ content_status: 'posted', updated_at: publishedAt })
          .eq('workspace_id', workspaceId)
          .in('id', mediaIds);

        await service
          .from('media_usage_events')
          .insert(
            mediaIds.map((mediaAssetId: string) => ({
              workspace_id: workspaceId,
              media_asset_id: mediaAssetId,
              usage_type: 'content_published',
              platform: resolvedPlatform,
              reference_id: post.id,
              created_by: user.id,
            }))
          );
      }
    } else {
      const nextPostStatus = remaining.some((item: any) => item.status === 'scheduled')
        ? 'scheduled'
        : 'approved';
      await service
        .from('content_posts')
        .update({ status: nextPostStatus, updated_at: publishedAt })
        .eq('id', post.id);
    }

    return { variant: publishedVariant, published: true, duplicatePrevented: false, verification };
  }

  async getDetail(supabase: any, workspaceId: string, contentPostId: string) {
    const { data, error } = await supabase
      .from('content_posts')
      .select(`
        *,
        media:content_post_media(id,position,role,asset:media_assets(*))
      `)
      .eq('workspace_id', workspaceId)
      .eq('id', contentPostId)
      .single();

    if (error || !data) return null;
    return data;
  }
}
