export interface PublishContentInput {
  platform: string;
  format: string;
  caption: string;
  hook?: string | null;
  cta?: string | null;
  hashtags: string[];
  scheduledFor?: string | null;
  idempotencyKey: string;
}

export interface PublishContentResult {
  status: 'published' | 'failed' | 'unknown';
  providerPostId?: string;
  liveUrl?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export interface SocialPublishingAdapter {
  publish(input: PublishContentInput): Promise<PublishContentResult>;
}

export class ManualDemoPublishingAdapter implements SocialPublishingAdapter {
  async publish(input: PublishContentInput): Promise<PublishContentResult> {
    return {
      status: 'published',
      providerPostId: `demo_post_${Date.now()}`,
      liveUrl: `angelos-demo://content/${encodeURIComponent(input.idempotencyKey)}`,
      raw: { transport: 'manual-demo', platform: input.platform, idempotencyKey: input.idempotencyKey }
    };
  }
}
