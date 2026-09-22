import { SocialPublishingAdapter, PublishContentInput, PublishContentResult } from './publishing-adapter';
export interface MetaPublishingAdapterConfig {
    workspaceId: string;
    externalAccountId: string;
    pageId?: string;
    instagramAccountId?: string;
}
export declare class MetaPublishingAdapter implements SocialPublishingAdapter {
    private readonly config;
    constructor(config: MetaPublishingAdapterConfig);
    publish(input: PublishContentInput): Promise<PublishContentResult>;
}
