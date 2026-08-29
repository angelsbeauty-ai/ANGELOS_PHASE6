export interface BillingProvider {
  readonly name: string;
  readonly configured: boolean;
  createCheckout(input: { workspaceId: string; billingInterval: 'monthly' | 'yearly'; discountPercent: number }): Promise<{ mode: 'checkout' | 'not_configured'; url?: string; message?: string }>;
}

export class UnconfiguredBillingProvider implements BillingProvider {
  readonly name = 'none';
  readonly configured = false;
  async createCheckout() {
    return { mode: 'not_configured' as const, message: 'A production payment provider has not been connected yet.' };
  }
}
