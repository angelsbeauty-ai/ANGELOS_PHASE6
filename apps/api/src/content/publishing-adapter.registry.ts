import { Injectable, OnModuleInit } from '@nestjs/common';
import { ManualDemoPublishingAdapter, SocialPublishingAdapter } from './publishing-adapter';

/**
 * Registry for social publishing adapters.
 * Pattern mirrors messaging provider adapters: register by platform name,
 * resolve at publish time, gate behind transport-enabled flag.
 */
@Injectable()
export class PublishingAdapterRegistry implements OnModuleInit {
  private adapters = new Map<string, SocialPublishingAdapter>();

  onModuleInit() {
    // Always register the manual demo adapter — it's the safe fallback.
    this.adapters.set('manual', new ManualDemoPublishingAdapter());
  }

  register(platform: string, adapter: SocialPublishingAdapter) {
    this.adapters.set(platform, adapter);
  }

  resolve(platform: string): SocialPublishingAdapter | null {
    return this.adapters.get(platform) ?? null;
  }

  has(platform: string): boolean {
    return this.adapters.has(platform);
  }

  /** Platforms that have a real (non-demo) adapter registered. */
  get livePlatforms(): string[] {
    return Array.from(this.adapters.keys()).filter(
      p => p !== 'manual'
    );
  }
}
