export interface MessagingSendInput {
  externalThreadId: string;
  body: string;
  idempotencyKey: string;
  // Only needed by adapters that must load live credentials to send (e.g. Meta). The manual
  // demo adapter and Flow 1's synthetic adapter both ignore these.
  workspaceId?: string;
  provider?: string;
  externalAccountId?: string;
}

export interface MessagingSendResult {
  status: 'sent' | 'failed' | 'unknown';
  externalMessageId?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export interface MessagingProviderAdapter {
  send(input: MessagingSendInput): Promise<MessagingSendResult>;
}

export class ManualDemoMessagingAdapter implements MessagingProviderAdapter {
  async send(input: MessagingSendInput): Promise<MessagingSendResult> {
    return {
      status: 'sent',
      externalMessageId: `demo_${input.idempotencyKey}`,
      raw: { transport: 'manual-demo', idempotencyKey: input.idempotencyKey }
    };
  }
}
