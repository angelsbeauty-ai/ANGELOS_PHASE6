import type { MessagingProviderAdapter, MessagingSendInput, MessagingSendResult } from './provider-adapter';
export declare function metaTransportEnabled(workspaceId?: string): boolean;
interface MetaAppCredentials {
    appId: string;
    appSecret: string;
}
export declare function loadMetaAppCredentials(): Promise<MetaAppCredentials>;
export declare function metaCredentialStatus(workspaceId: string): Promise<{
    appCredentials: {
        configured: boolean;
    };
    webhookVerifyToken: {
        configured: boolean;
    };
    transport: {
        enabled: boolean;
        pinnedWorkspace: string | null;
    };
    connections: {
        provider: any;
        status: any;
        tokenPresent: boolean;
        expiresAt: any;
        expired: boolean;
    }[];
    channels: {
        provider: any;
        status: any;
        externalAccountIdPresent: boolean;
    }[];
}>;
export declare class MetaMessagingAdapter implements MessagingProviderAdapter {
    send(input: MessagingSendInput): Promise<MessagingSendResult>;
}
export {};
