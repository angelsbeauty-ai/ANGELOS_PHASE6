"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualDemoMessagingAdapter = void 0;
class ManualDemoMessagingAdapter {
    async send(input) {
        return {
            status: 'sent',
            externalMessageId: `demo_${input.idempotencyKey}`,
            raw: { transport: 'manual-demo', idempotencyKey: input.idempotencyKey }
        };
    }
}
exports.ManualDemoMessagingAdapter = ManualDemoMessagingAdapter;
//# sourceMappingURL=provider-adapter.js.map