export interface MessagingSendInput {
  externalThreadId: string;
  body: string;
  idempotencyKey: string;
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
      externalMessageId: `demo_${Date.now()}`,
      raw: { transport: 'manual-demo', idempotencyKey: input.idempotencyKey }
    };
  }
}
