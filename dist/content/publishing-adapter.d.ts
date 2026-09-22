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
export declare class ManualDemoPublishingAdapter implements SocialPublishingAdapter {
    publish(input: PublishContentInput): Promise<PublishContentResult>;
}
