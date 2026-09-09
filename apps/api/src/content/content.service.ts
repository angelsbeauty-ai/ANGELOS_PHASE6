import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from '../ai/ai-provider.service';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { CreateContentDraftDto } from './dto/create-content-draft.dto';
import type { ReviewContentMediaDto } from './dto/review-content-media.dto';
import type { UpdateContentVariantDto } from './dto/update-content-variant.dto';
import { PublishingService } from './publishing.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly aiProvider: AiProviderService,
    private readonly publishing: PublishingService
  ) {}

  async list(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('content_posts')
      .select('*,media:content_post_media(id,position,role,asset:media_assets(id,original_filename,media_type,content_status,marketing_permission)),variants:content_variants(*)')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async get(user: AuthUser, workspaceId: string, contentPostId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('content_posts')
      .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', contentPostId)
      .single();
    if (error || !data) throw new NotFoundException('Content post not found');
    return data;
  }

  async reviewMedia(user: AuthUser, workspaceId: string, dto: ReviewContentMediaDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const mediaAssets = await this.getMediaAssets(supabase, workspaceId);
    const eligible = mediaAssets.filter((asset: any) => this.isMarketingEligible(asset));
    return { total: mediaAssets.length, eligible_count: eligible.length, eligible };
  }

  async createDraft(user: AuthUser, workspaceId: string, dto: CreateContentDraftDto) {
    const now = new Date().toISOString();
    const service = createServiceSupabaseClient();

    // Build a content post with one variant per platform
    const platformVariants = dto.platforms.map((platform) => ({
      platform,
      caption: '',
      status: 'draft',
      capabilities_snapshot: platform === 'manual' ? { demo: true, publish: true } : { connected: false, publish: false, sprint: 7 },
    }));

    // Create content_post + variants
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

    if (postError || !post) throw new InternalServerErrorException(postError?.message ?? 'Could not create content post');

    // Insert variants
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

    // Attach media if provided
    if (dto.mediaAssetIds?.length) {
      await service.from('content_post_media').insert(
        dto.mediaAssetIds.map((mediaId, position) => ({
          content_post_id: post.id,
          workspace_id: workspaceId,
          media_asset_id: mediaId,
          position,
          role: 'primary',
          created_by: user.id,
        }))
      );
    }

    // Return full post with variants
    const { data: fullPost } = await service
      .from('content_posts')
      .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
      .eq('id', post.id)
      .single();

    return fullPost;
  }

  async approve(user: AuthUser, workspaceId: string, contentPostId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: detail, error } = await supabase
      .from('content_posts')
      .select('*,media:content_post_media(id,position,role,asset:media_assets(*)),variants:content_variants(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', contentPostId)
      .single();

    if (error || !detail) throw new NotFoundException('Content post not found');
    if (detail.status !== 'draft') throw new ConflictException('Only draft content can be approved');

    // Validate all variants have captions
    if (!detail.variants?.length) throw new BadRequestException('Content post has no platform variants');
    if (detail.variants.some((variant: any) => !variant.caption?.trim())) {
      throw new BadRequestException('Every platform variant needs a caption before approval');
    }

    // Generate strategy direction via AI (use AiProviderRequest shape)
    const mediaSummary = this.summarizeMedia(detail.media ?? []);
    const postResult = await this.aiProvider.generate({
      instructions: 'Generate a short content strategy direction based on the objective, goal, format, platforms, and available media.',
      input: `CONTENT_STRATEGY\nObjective=${detail.objective}\nGoal=${detail.goal ?? ''}\nFormat=${detail.variants?.[0]?.format ?? 'unknown'}\nPlatforms=${detail.variants?.map((v: any) => v.platform).join(',')}\nMedia=${JSON.stringify(mediaSummary)}`,
    });

    const strategyDirection = postResult?.text?.trim() ?? null;

    // Update post to prepared
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

    if (updateError || !updated) throw new InternalServerErrorException(updateError?.message ?? 'Could not approve content');

    return updated;
  }

  async updateVariant(user: AuthUser, workspaceId: string, variantId: string, dto: UpdateContentVariantDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: variant, error } = await supabase
      .from('content_variants')
      .select('*,post:content_posts(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', variantId)
      .single();

    if (error || !variant) throw new NotFoundException('Content variant not found');
    if (variant.status !== 'draft' && variant.status !== 'prepared') {
      throw new ConflictException('Only draft or prepared variants can be edited');
    }

    const updates: any = { updated_at: new Date().toISOString(), updated_by: user.id };
    if (dto.caption !== undefined) updates.caption = dto.caption;
    if (dto.hook !== undefined) updates.hook = dto.hook;
    if (dto.cta !== undefined) updates.cta = dto.cta;
    if (dto.hashtags !== undefined) updates.hashtags = dto.hashtags;

    const { data: updated } = await supabase
      .from('content_variants')
      .update(updates)
      .eq('id', variantId)
      .select()
      .single();

    if (error || !updated) throw new InternalServerErrorException('Could not update variant');
    return updated;
  }

  async scheduleVariant(user: AuthUser, workspaceId: string, variantId: string, scheduledFor: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: variant, error } = await supabase
      .from('content_variants')
      .select('*,post:content_posts(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', variantId)
      .single();

    if (error || !variant) throw new NotFoundException('Content variant not found');
    if (!['prepared', 'approved'].includes(variant.status)) {
      throw new ConflictException('Only prepared or approved variants can be scheduled');
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

    if (error || !updated) throw new InternalServerErrorException('Could not schedule variant');
    return updated;
  }

  async publishNow(user: AuthUser, workspaceId: string, variantId: string) {
    return this.publishing.publishNow(user, workspaceId, variantId);
  }

  async getPublishStatus(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('content_posts')
      .select('id,status,strategy_direction,updated_at,variants:content_variants(id,platform,status,scheduled_for,published_at)')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  private getMediaAssets(supabase: any, workspaceId: string) {
    return supabase.from('media_assets').select('*').eq('workspace_id', workspaceId).eq('is_upload_approved', true).neq('marketing_permission', 'revoked');
  }

  private isMarketingEligible(asset: any): boolean {
    return asset?.marketing_permission === 'eligible' &&
      asset?.is_upload_approved === true &&
      (!asset?.consent_required || asset?.consent_granted === true);
  }

  private summarizeMedia(media: any[]) {
    return media.slice(0, 8).map((m: any) => ({
      id: m.asset?.id,
      filename: m.asset?.original_filename,
      media_type: m.asset?.media_type,
      role: m.role,
      marketing_permission: m.asset?.marketing_permission,
    }));
  }
}
