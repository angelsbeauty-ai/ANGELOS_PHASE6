import { SocialPublishingAdapter, PublishContentInput, PublishContentResult } from './publishing-adapter';

export interface MetaPublishingAdapterConfig {
  workspaceId: string;
  externalAccountId: string;
  pageId?: string;
  instagramAccountId?: string;
}

/**
 * Stub for Meta/Instagram publishing adapter.
 *
 * When real Meta credentials exist, this adapter will:
 *   1. Load credentials from oauth_connections / integration_apps (same pattern as Meta messaging)
 *   2. POST to Graph API v21.0 for Instagram publishing or Facebook Page publishing
 *   3. Record the result through content_publish_attempts (idempotency + result)
 *
 * For now, this is a placeholder that explains what will be built.
 * The content approve → publish → result path is already wired through
 * ManualDemoPublishingAdapter. When credentials arrive, swap in this adapter.
 */
export class MetaPublishingAdapter implements SocialPublishingAdapter {
  constructor(private readonly config: MetaPublishingAdapterConfig) {}

  async publish(input: PublishContentInput): Promise<PublishContentResult> {
    // TODO: when Meta credentials are available, implement:
    //   - Load long-lived page/IG token from Supabase
    //   - For Instagram: POST /{ig-user-id}/media with {image_url, caption}
    //     then POST /{media-id}/media_container for video, then publish
    //   - For Facebook Page: POST /{page-id}/photos or /{page-id}/videos
    //   - Record idempotency + result via content_publish_attempts
    //
    // Until then, this adapter is NOT registered — the manual demo adapter
    // handles publishing, and publishNow rejects non-manual platforms at
    // content.service.ts:191.
    return {
      status: 'failed',
      error: 'Meta publishing adapter not connected. Meta credentials required.'
    };
  }
}
