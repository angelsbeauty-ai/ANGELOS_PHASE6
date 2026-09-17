export interface MessagingSendInput {
    externalThreadId: string;
    body: string;
    idempotencyKey: string;
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
export declare class ManualDemoMessagingAdapter implements MessagingProviderAdapter {
    send(input: MessagingSendInput): Promise<MessagingSendResult>;
}
