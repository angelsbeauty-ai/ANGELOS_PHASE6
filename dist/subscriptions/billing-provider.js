"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnconfiguredBillingProvider = void 0;
class UnconfiguredBillingProvider {
    name = 'none';
    configured = false;
    async createCheckout() {
        return { mode: 'not_configured', message: 'A production payment provider has not been connected yet.' };
    }
}
exports.UnconfiguredBillingProvider = UnconfiguredBillingProvider;
//# sourceMappingURL=billing-provider.js.map