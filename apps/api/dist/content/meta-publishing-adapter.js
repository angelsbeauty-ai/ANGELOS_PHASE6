"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaPublishingAdapter = void 0;
class MetaPublishingAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async publish(input) {
        return {
            status: 'failed',
            error: 'Meta publishing adapter not connected. Meta credentials required.'
        };
    }
}
exports.MetaPublishingAdapter = MetaPublishingAdapter;
//# sourceMappingURL=meta-publishing-adapter.js.map