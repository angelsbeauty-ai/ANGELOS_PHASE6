export declare class ConnectMetaChannelDto {
    provider: 'instagram' | 'facebook';
    displayName: string;
    externalAccountId: string;
    accessToken: string;
    accessExpiresAt: string;
    scopes?: string;
}
