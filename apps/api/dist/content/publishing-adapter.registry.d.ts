import { OnModuleInit } from '@nestjs/common';
import { SocialPublishingAdapter } from './publishing-adapter';
export declare class PublishingAdapterRegistry implements OnModuleInit {
    private adapters;
    onModuleInit(): void;
    register(platform: string, adapter: SocialPublishingAdapter): void;
    resolve(platform: string): SocialPublishingAdapter | null;
    has(platform: string): boolean;
    get livePlatforms(): string[];
}
