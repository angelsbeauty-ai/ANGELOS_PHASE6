"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualDemoPublishingAdapter = void 0;
class ManualDemoPublishingAdapter {
    async publish(input) {
        return {
            status: 'published',
            providerPostId: `demo_post_${Date.now()}`,
            liveUrl: `angelos-demo://content/${encodeURIComponent(input.idempotencyKey)}`,
            raw: { transport: 'manual-demo', platform: input.platform, idempotencyKey: input.idempotencyKey }
        };
    }
}
exports.ManualDemoPublishingAdapter = ManualDemoPublishingAdapter;
//# sourceMappingURL=publishing-adapter.js.map