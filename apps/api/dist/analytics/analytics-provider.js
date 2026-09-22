"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailableAnalyticsAdapter = void 0;
class UnavailableAnalyticsAdapter {
    platform;
    constructor(platform) {
        this.platform = platform;
    }
    async fetchContentMetrics() {
        return null;
    }
    async fetchAudienceActivity() {
        return [];
    }
}
exports.UnavailableAnalyticsAdapter = UnavailableAnalyticsAdapter;
//# sourceMappingURL=analytics-provider.js.map