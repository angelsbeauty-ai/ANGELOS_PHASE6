import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from '../ai/ai-provider.service';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { CreateContentDraftDto } from './dto/create-content-draft.dto';
import type { ReviewContentMediaDto } from './dto/review-content-media.dto';
import type { UpdateContentVariantDto } from './dto/update-content-variant.dto';
import { ManualDemoPublishingAdapter } from './publishing-adapter';

@Injectable()
export class ContentService {
  private readonly demoPublisher = new ManualDemoPublishingAdapter();
  constructor(private readonly aiProvider: AiProviderService) {}

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
    const { data, error } = await supabase
      .from('media_assets')
      .select('*,links:media_asset_links(id,client_id,appointment_id,role,client:clients(id,display_name))')
      .eq('workspace_id', workspaceId)
      .eq('upload_status', 'uploaded')
      .eq('lifecycle_status', 'active')
      .in('content_status', ['unused','reviewed','selected'])
      .order('captured_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new InternalServerErrorException(error.message);

    const eligible = (data ?? []).filter((asset: any) => isMarketingEligible(asset));
    const ranked: Array<{ asset: any; score: number }> = eligible
      .map((asset: any) => ({ asset, score: scoreAsset(asset, dto.objective) }))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    if (ranked.length === 0) {
      return {
        recommendation: null,
        reason: 'No unused media currently has marketing permission. AngelOS will not recommend private or treatment-only media for social posting.',
        candidates: []
      };
    }

    const fallback = buildRuleBasedMediaRecommendation(ranked, dto.objective);
    const visual = await this.tryVisualMediaReview(ranked, dto.objective);
    const recommendation = visual ?? fallback;

    return {
      recommendation,
      reviewMode: visual ? 'ai_vision' : 'metadata_fallback',
      candidates: ranked.slice(0, 8).map(({ asset, score }: { asset: any; score: number }) => ({ id: asset.id, filename: asset.original_filename, mediaType: asset.media_type, score, role: asset.links?.[0]?.role ?? 'other', clientName: asset.links?.[0]?.client?.display_name ?? null }))
    };
  }

  async createDraft(user: AuthUser, workspaceId: string, dto: CreateContentDraftDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: assets, error } = await supabase
      .from('media_assets')
      .select('*,links:media_asset_links(role,client:clients(display_name))')
      .eq('workspace_id', workspaceId)
      .in('id', dto.mediaAssetIds);
    if (error) throw new InternalServerErrorException(error.message);
    if (!assets || assets.length !== dto.mediaAssetIds.length) throw new BadRequestException('One or more media assets do not belong to this workspace');
    if (assets.some((asset: any) => asset.upload_status !== 'uploaded')) throw new BadRequestException('All selected media must be fully uploaded first');
    if (assets.some((asset: any) => !isMarketingEligible(asset))) throw new ConflictException('One or more selected assets do not have marketing permission');

    const primaryFormat = chooseFormat(assets, dto.objective);
    const aiDraft = await this.generateAiDraft(dto, assets, primaryFormat);
    const service = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const { data: post, error: postError } = await service.from('content_posts').insert({
      workspace_id: workspaceId,
      title: dto.title.trim(),
      objective: dto.objective,
      primary_format: primaryFormat,
      status: 'prepared',
      source_goal: dto.goal?.trim() || null,
      strategy_reason: aiDraft.strategyReason,
      editing_instructions: aiDraft.editingInstructions,
      created_by: user.id,
      updated_at: now
    }).select('*').single();
    if (postError || !post) throw new InternalServerErrorException(postError?.message ?? 'Could not create content post');

    try {
      const mediaRows = dto.mediaAssetIds.map((mediaAssetId, position) => ({
        workspace_id: workspaceId,
        content_post_id: post.id,
        media_asset_id: mediaAssetId,
        position,
        role: position === 0 ? 'primary' : 'secondary'
      }));
      const { error: mediaError } = await service.from('content_post_media').insert(mediaRows);
      if (mediaError) throw mediaError;

      const variantRows = dto.platforms.map((platform) => ({
        workspace_id: workspaceId,
        content_post_id: post.id,
        platform,
        format: primaryFormat,
        hook: aiDraft.hook,
        caption: aiDraft.caption,
        cta: aiDraft.cta,
        hashtags: aiDraft.hashtags,
        status: 'draft',
        capabilities_snapshot: platform === 'manual' ? { demo: true, publish: true } : { connected: false, publish: false, sprint: 7 },
        rule_version: 'sprint7-prototype'
      }));
      const { error: variantError } = await service.from('content_variants').insert(variantRows);
      if (variantError) throw variantError;

      await service.from('media_assets').update({ content_status: 'selected', updated_at: now }).eq('workspace_id', workspaceId).in('id', dto.mediaAssetIds);
      await service.from('media_usage_events').insert(dto.mediaAssetIds.map((mediaAssetId) => ({ workspace_id: workspaceId, media_asset_id: mediaAssetId, usage_type: 'content_selected', reference_id: post.id, created_by: user.id })));
      return this.get(user, workspaceId, post.id);
    } catch (caught) {
      // Prototype compensation keeps partial draft creation from leaving orphan content records.
      await service.from('content_posts').delete().eq('workspace_id', workspaceId).eq('id', post.id);
      const message = caught instanceof Error ? caught.message : 'Could not finish content draft';
      throw new InternalServerErrorException(message);
    }
  }

  async updateVariant(user: AuthUser, workspaceId: string, variantId: string, dto: UpdateContentVariantDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.hook !== undefined) updates.hook = dto.hook.trim();
    if (dto.caption !== undefined) updates.caption = dto.caption.trim();
    if (dto.cta !== undefined) updates.cta = dto.cta.trim();
    if (dto.hashtags !== undefined) updates.hashtags = dto.hashtags.map((tag) => normalizeHashtag(tag)).filter(Boolean);
    if (dto.scheduledFor !== undefined) updates.scheduled_for = dto.scheduledFor;
    const { data, error } = await supabase.from('content_variants').update(updates).eq('workspace_id', workspaceId).eq('id', variantId).select('*').single();
    if (error || !data) throw new NotFoundException('Content variant not found');
    return data;
  }

  async approve(user: AuthUser, workspaceId: string, contentPostId: string) {
    const detail = await this.get(user, workspaceId, contentPostId);
    if (!detail.variants?.length) throw new BadRequestException('Content post has no platform variants');
    if (detail.variants.some((variant: any) => !variant.caption?.trim())) throw new BadRequestException('Every platform variant needs a caption before approval');
    const service = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const { data: post, error } = await service.from('content_posts').update({ status: 'approved', approved_by: user.id, approved_at: now, updated_at: now }).eq('workspace_id', workspaceId).eq('id', contentPostId).select('*').single();
    if (error || !post) throw new NotFoundException('Content post not found');
    await service.from('content_variants').update({ status: 'approved', updated_at: now }).eq('workspace_id', workspaceId).eq('content_post_id', contentPostId).in('status', ['draft','approved']);
    return this.get(user, workspaceId, contentPostId);
  }

  async scheduleVariant(user: AuthUser, workspaceId: string, variantId: string, scheduledFor: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: variant, error } = await supabase.from('content_variants').select('*,post:content_posts(id,status)').eq('workspace_id', workspaceId).eq('id', variantId).single();
    if (error || !variant) throw new NotFoundException('Content variant not found');
    if ((variant as any).post?.status !== 'approved' && (variant as any).post?.status !== 'scheduled') throw new ConflictException('Approve the content post before scheduling it');
    if (new Date(scheduledFor).getTime() <= Date.now()) throw new BadRequestException('Scheduled time must be in the future');
    const service = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await service.from('content_variants').update({ scheduled_for: scheduledFor, status: 'scheduled', updated_at: now }).eq('workspace_id', workspaceId).eq('id', variantId).select('*').single();
    if (updateError || !updated) throw new InternalServerErrorException(updateError?.message ?? 'Could not schedule content');
    await service.from('content_posts').update({ status: 'scheduled', updated_at: now }).eq('workspace_id', workspaceId).eq('id', (variant as any).content_post_id);
    return updated;
  }

  async publishNow(user: AuthUser, workspaceId: string, variantId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: variant, error } = await supabase.from('content_variants').select('*,post:content_posts(*)').eq('workspace_id', workspaceId).eq('id', variantId).single();
    if (error || !variant) throw new NotFoundException('Content variant not found');
    const post = (variant as any).post;
    if (!['approved','scheduled','publishing'].includes(post?.status)) throw new ConflictException('Content must be approved before publishing');
    if (!['approved','scheduled','publishing'].includes(variant.status)) throw new ConflictException('This platform version is not approved for publishing');
    if (variant.platform !== 'manual') throw new ConflictException('Live social publishing is not connected in Sprint 7. AngelOS stops here instead of pretending the post was published.');

    // Re-check marketing permission at publish time because consent can change after approval.
    const detail = await this.get(user, workspaceId, post.id);
    const assets = detail.media?.map((row: any) => row.asset).filter(Boolean) ?? [];
    if (assets.some((asset: any) => !isMarketingEligible(asset))) throw new ConflictException('Publishing stopped because media permission changed after approval');

    const idempotencyKey = `content:${variant.id}`;
    const service = createServiceSupabaseClient();
    const { data: previous } = await service.from('content_publish_attempts').select('*').eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle();
    if (previous?.status === 'published') return { variant, published: true, duplicatePrevented: true, verification: previous.verification };

    const now = new Date().toISOString();
    const attemptNo = Number(previous?.attempt_no ?? 0) + 1;
    if (previous) {
      const queued = await service.from('content_publish_attempts').update({ status: 'publishing', attempt_no: attemptNo, error_message: null }).eq('workspace_id', workspaceId).eq('id', previous.id);
      if (queued.error) throw new InternalServerErrorException(queued.error.message);
    } else {
      const queued = await service.from('content_publish_attempts').insert({ workspace_id: workspaceId, content_variant_id: variant.id, idempotency_key: idempotencyKey, attempt_no: attemptNo, status: 'publishing' });
      if (queued.error) throw new InternalServerErrorException(queued.error.message);
    }
    await service.from('content_posts').update({ status: 'publishing', updated_at: now }).eq('id', post.id);
    await service.from('content_variants').update({ status: 'publishing', updated_at: now }).eq('id', variant.id);
    const result = await this.demoPublisher.publish({ platform: variant.platform, format: variant.format, caption: variant.caption, hook: variant.hook, cta: variant.cta, hashtags: variant.hashtags ?? [], scheduledFor: variant.scheduled_for, idempotencyKey });
    if (result.status !== 'published') {
      await service.from('content_publish_attempts').update({ status: result.status === 'failed' ? 'failed' : 'unknown', provider_response: result.raw ?? null, error_message: result.error ?? null }).eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey);
      await service.from('content_variants').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', variant.id);
      await service.from('content_posts').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', post.id);
      throw new InternalServerErrorException(result.error ?? 'Publishing could not be verified');
    }

    const publishedAt = new Date().toISOString();
    const verification = { verified: true, transport: 'manual-demo', providerPostId: result.providerPostId, verifiedAt: publishedAt };
    await service.from('content_publish_attempts').update({ status: 'published', provider_response: result.raw ?? null, verification, error_message: null }).eq('workspace_id', workspaceId).eq('idempotency_key', idempotencyKey);
    const { data: publishedVariant, error: updateError } = await service.from('content_variants').update({ status: 'published', provider_post_id: result.providerPostId, live_url: result.liveUrl, published_at: publishedAt, updated_at: publishedAt }).eq('id', variant.id).select('*').single();
    if (updateError || !publishedVariant) throw new InternalServerErrorException(updateError?.message ?? 'Could not finalize published content');

    const { data: remaining } = await service.from('content_variants').select('id,status').eq('workspace_id', workspaceId).eq('content_post_id', post.id).neq('status', 'published').neq('status', 'archived');
    if (!remaining?.length) {
      await service.from('content_posts').update({ status: 'published', updated_at: publishedAt }).eq('id', post.id);
      const mediaIds = detail.media?.map((row: any) => row.asset?.id).filter(Boolean) ?? [];
      if (mediaIds.length) {
        await service.from('media_assets').update({ content_status: 'posted', updated_at: publishedAt }).eq('workspace_id', workspaceId).in('id', mediaIds);
        await service.from('media_usage_events').insert(mediaIds.map((mediaAssetId: string) => ({ workspace_id: workspaceId, media_asset_id: mediaAssetId, usage_type: 'content_published', platform: variant.platform, reference_id: post.id, created_by: user.id })));
      }
    } else {
      const nextPostStatus = remaining.some((item: any) => item.status === 'scheduled') ? 'scheduled' : 'approved';
      await service.from('content_posts').update({ status: nextPostStatus, updated_at: publishedAt }).eq('id', post.id);
    }
    return { variant: publishedVariant, published: true, duplicatePrevented: false, verification };
  }


  private async tryVisualMediaReview(ranked: Array<{ asset: any; score: number }>, objective?: string) {
    if ((process.env.AI_PROVIDER_MODE ?? 'mock') !== 'openai') return null;
    const imageCandidates = ranked.filter((row) => row.asset.media_type === 'image').slice(0, 6);
    if (!imageCandidates.length) return null;
    const service = createServiceSupabaseClient();
    const urls: string[] = [];
    const labels: string[] = [];
    for (let index = 0; index < imageCandidates.length; index += 1) {
      const asset = imageCandidates[index].asset;
      const { data, error } = await service.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 180);
      if (error || !data?.signedUrl) continue;
      urls.push(data.signedUrl);
      labels.push(`Image ${urls.length}: id=${asset.id}; role=${asset.links?.[0]?.role ?? 'other'}; client=${asset.links?.[0]?.client?.display_name ?? 'unknown'}; filename=${asset.original_filename}`);
    }
    if (!urls.length) return null;
    try {
      const response = await this.aiProvider.generate({
        instructions: 'You are AngelOS Content Creator. Review the supplied business images for social-media usefulness. Return JSON only with selectedIds (1 or 2 IDs), format (reel, story, carousel, or photo), and reason. Prefer clear, well-framed, natural-looking, polished results. If a before/after pair clearly belongs together, you may select both. Do not infer medical facts, identity, consent, or outcomes not visible. Do not select more than 2 images.',
        input: `Objective=${objective ?? 'business growth'}\n${labels.join('\n')}`,
        imageUrls: urls
      });
      const parsed = safeJsonObject(response.text);
      const selectedIds = Array.isArray(parsed?.selectedIds) ? parsed.selectedIds.map(String).filter((id: string) => imageCandidates.some((row) => row.asset.id === id)).slice(0, 2) : [];
      if (!selectedIds.length) return null;
      const selectedAssets = selectedIds.map((id: string) => imageCandidates.find((row) => row.asset.id === id)?.asset).filter(Boolean);
      return {
        mediaAssetIds: selectedAssets.map((asset: any) => asset.id),
        format: ['reel','story','carousel','photo'].includes(String(parsed?.format)) ? String(parsed?.format) : chooseFormat(selectedAssets, objective),
        reason: stringOr(parsed?.reason, buildRecommendationReason(selectedAssets, chooseFormat(selectedAssets, objective), objective))
      };
    } catch {
      return null;
    }
  }

  private async generateAiDraft(dto: CreateContentDraftDto, assets: any[], format: string) {
    const mediaSummary = assets.map((asset) => ({ filename: asset.original_filename, mediaType: asset.media_type, role: asset.links?.[0]?.role ?? 'other', clientName: asset.links?.[0]?.client?.display_name ?? null }));
    const fallback = buildFallbackDraft(dto.objective, format, mediaSummary);
    try {
      const response = await this.aiProvider.generate({
        instructions: 'You are AngelOS Content Creator and Social Media Marketer. Return valid JSON only with keys strategyReason, hook, caption, cta, hashtags (array of up to 5 short strings), editingInstructions (object). Give ONE strongest recommendation. Do not invent client facts, prices, outcomes, or guarantees. Keep the caption natural and service-business appropriate. If data is limited, stay general rather than fabricating. No markdown.',
        input: `CONTENT_DRAFT_JSON\nObjective=${dto.objective}\nGoal=${dto.goal ?? ''}\nFormat=${format}\nPlatforms=${dto.platforms.join(',')}\nMedia=${JSON.stringify(mediaSummary)}`
      });
      const parsed = safeJsonObject(response.text);
      if (!parsed) return fallback;
      return {
        strategyReason: stringOr(parsed.strategyReason, fallback.strategyReason),
        hook: stringOr(parsed.hook, fallback.hook),
        caption: stringOr(parsed.caption, fallback.caption),
        cta: stringOr(parsed.cta, fallback.cta),
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 5).map((tag: unknown) => normalizeHashtag(String(tag))).filter(Boolean) : fallback.hashtags,
        editingInstructions: typeof parsed.editingInstructions === 'object' && parsed.editingInstructions ? parsed.editingInstructions : fallback.editingInstructions
      };
    } catch {
      return fallback;
    }
  }

  async getPublishStatus(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: posts, error } = await supabase
      .from('content_posts')
      .select('*,variants:content_variants(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    const postsList = (posts ?? []).map((p: any) => {
      const variants = (p.variants ?? []).map((v: any) => ({
        id: v.id, platform: v.platform, status: v.status,
        caption: v.caption ?? undefined, scheduledFor: v.scheduled_for ?? undefined,
        publishedAt: v.published_at ?? undefined, providerPostId: v.provider_post_id ?? undefined
      }));
      return {
        id: p.id, title: p.title, status: p.status, objective: p.objective,
        createdAt: p.created_at, approvedAt: p.approved_at ?? undefined,
        scheduledFor: p.scheduled_for ?? undefined, publishedAt: p.published_at ?? undefined,
        variants
      };
    });

    const counts = {
      total: postsList.length,
      prepared: postsList.filter(p => p.status === 'prepared').length,
      approved: postsList.filter(p => p.status === 'approved').length,
      scheduled: postsList.filter(p => p.status === 'scheduled').length,
      publishing: postsList.filter(p => p.status === 'publishing').length,
      published: postsList.filter(p => p.status === 'published').length,
      failed: postsList.filter(p => p.status === 'failed').length
    };

    return { workspaceId, posts: postsList, ...counts };
  }
}




function buildRuleBasedMediaRecommendation(ranked: Array<{ asset: any; score: number }>, objective?: string) {
  const best = ranked[0].asset;
  const sameClient = best.links?.[0]?.client_id
    ? ranked.filter((row: { asset: any; score: number }) => row.asset.links?.some((link: any) => link.client_id === best.links[0].client_id))
    : ranked;
  const before = sameClient.find((row: { asset: any; score: number }) => row.asset.links?.some((link: any) => link.role === 'before'))?.asset;
  const after = sameClient.find((row: { asset: any; score: number }) => row.asset.links?.some((link: any) => link.role === 'after'))?.asset;
  const selected = before && after && before.id !== after.id ? [before, after] : [best];
  const format = chooseFormat(selected, objective);
  return {
    mediaAssetIds: selected.map((asset: any) => asset.id),
    format,
    reason: buildRecommendationReason(selected, format, objective)
  };
}

function isMarketingEligible(asset: any) {
  if (asset.marketing_permission === 'marketing_approved') return true;
  if (asset.marketing_permission !== 'limited') return false;
  const scope = asset.marketing_scope ?? {};
  return scope.social === true || scope.instagram === true || scope.facebook === true || scope.tiktok === true;
}

function scoreAsset(asset: any, objective?: string) {
  let score = 0;
  if (asset.media_type === 'video') score += objective === 'reach' ? 18 : 10;
  if (asset.media_type === 'image') score += 8;
  if (asset.content_status === 'unused') score += 12;
  if (asset.marketing_permission === 'marketing_approved') score += 15;
  if (asset.links?.some((link: any) => link.role === 'after')) score += 12;
  if (asset.links?.some((link: any) => link.role === 'before')) score += 8;
  if (asset.width && asset.height && asset.height > asset.width) score += 5;
  if (asset.captured_at) {
    const ageDays = Math.max(0, (Date.now() - new Date(asset.captured_at).getTime()) / 86400000);
    score += Math.max(0, 8 - ageDays / 30);
  }
  return Math.round(score * 10) / 10;
}

function chooseFormat(assets: any[], objective?: string) {
  if (objective === 'availability') return 'story';
  if (assets.some((asset) => asset.media_type === 'video')) return 'reel';
  if (assets.length > 1) return 'carousel';
  return 'photo';
}

function buildRecommendationReason(assets: any[], format: string, objective?: string) {
  if (assets.length > 1) return `This set has complementary before/after context and is still unused. A ${format} can show the transformation clearly for ${objective ?? 'business growth'}.`;
  const asset = assets[0];
  const role = asset.links?.[0]?.role;
  return `This is one of the strongest currently eligible unused assets${role ? ` (${role})` : ''}. AngelOS recommends a ${format} for ${objective ?? 'the next post'}.`;
}

function buildFallbackDraft(objective: string, format: string, media: any[]) {
  const clientPart = media[0]?.clientName ? ` for ${media[0].clientName}` : '';
  return {
    strategyReason: `Use this ${format} to support ${objective}. Keep the message focused on the result and one clear next action.`,
    hook: objective === 'availability' ? 'Last-minute opening' : 'A closer look at this result',
    caption: objective === 'availability'
      ? 'A last-minute appointment opening is available. If you have been waiting for a spot, send a message to check the current time and service availability.'
      : `A fresh client result${clientPart}. The goal of this post is to show the work clearly and help the right local clients understand what you offer.`,
    cta: objective === 'bookings' || objective === 'availability' ? 'Message to check availability.' : 'Save this for your next appointment inspiration.',
    hashtags: ['#beautybusiness', '#beautyartist', '#clientresults'],
    editingInstructions: { length: format === 'reel' ? 'Keep it concise and remove dead time.' : null, crop: 'Use a clean vertical crop when possible.', look: 'Natural, polished, premium; avoid over-editing results.' }
  };
}

function normalizeHashtag(tag: string) {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return `#${trimmed.replace(/^#+/, '').replace(/\s+/g, '')}`.slice(0, 80);
}

function safeJsonObject(text: string): Record<string, any> | null {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const value = JSON.parse(cleaned);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
