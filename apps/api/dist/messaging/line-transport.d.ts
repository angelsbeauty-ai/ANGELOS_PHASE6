import type { MessagingProviderAdapter, MessagingSendInput, MessagingSendResult } from './provider-adapter';
export declare function lineTransportEnabled(workspaceId?: string): boolean;
interface LineChannelCredentials {
    channelSecret: string;
    accessToken: string;
}
export declare function loadLineChannelCredentials(): Promise<LineChannelCredentials>;
export declare function lineCredentialStatus(workspaceId: string): Promise<{
    channelCredentials: {
        configured: boolean;
    };
    transport: {
        enabled: boolean;
        pinnedWorkspace: string | null;
    };
    connection: {
        provider: any;
        status: any;
        tokenPresent: boolean;
        expiresAt: any;
        expired: boolean;
    } | null;
    channel: {
        provider: any;
        status: any;
        externalAccountIdPresent: boolean;
    } | null;
}>;
export declare class LineMessagingAdapter implements MessagingProviderAdapter {
    send(input: MessagingSendInput): Promise<MessagingSendResult>;
}
export {};
