import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient } from '../config/supabase';

export interface ContentPublishStatus {
  workspaceId: string;
  totalPosts: number;
  pendingApproval: number;
  approved: number;
  scheduled: number;
  publishing: number;
  published: number;
  failed: number;
  posts: ContentPostSummary[];
}

export interface ContentPostSummary {
  id: string;
  title: string;
  status: string;
  objective: string;
  createdAt: string;
  approvedAt?: string;
  scheduledFor?: string;
  publishedAt?: string;
  variants: VariantSummary[];
}

export interface VariantSummary {
  id: string;
  platform: string;
  status: string;
  caption?: string;
  scheduledFor?: string;
  publishedAt?: string;
  providerPostId?: string;
}

@Injectable()
export class ContentPublishStatusService {
  async getPublishStatus(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);

    const { data: posts, error } = await supabase
      .from('content_posts')
      .select('*,variants:content_variants(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const postList = (posts ?? []).map((p: any) => {
      const variants = (p.variants ?? []).map((v: any) => ({
        id: v.id,
        platform: v.platform,
        status: v.status,
        caption: v.caption ?? undefined,
        scheduledFor: v.scheduled_for ?? undefined,
        publishedAt: v.published_at ?? undefined,
        providerPostId: v.provider_post_id ?? undefined
      }));

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        objective: p.objective,
        createdAt: p.created_at,
        approvedAt: p.approved_at ?? undefined,
        scheduledFor: p.scheduled_for ?? undefined,
        publishedAt: p.published_at ?? undefined,
        variants
      };
    });

    const counts = {
      totalPosts: postList.length,
      pendingApproval: postList.filter(p => p.status === 'prepared').length,
      approved: postList.filter(p => p.status === 'approved').length,
      scheduled: postList.filter(p => p.status === 'scheduled').length,
      publishing: postList.filter(p => p.status === 'publishing').length,
      published: postList.filter(p => p.status === 'published').length,
      failed: postList.filter(p => p.status === 'failed').length
    };

    return { workspaceId, posts: postList, ...counts };
  }
}
