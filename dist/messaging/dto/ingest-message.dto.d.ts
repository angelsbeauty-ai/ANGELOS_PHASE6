export declare class IngestMessageDto {
    channelId: string;
    externalThreadId: string;
    externalUserId: string;
    contactDisplayName?: string;
    clientId?: string;
    body: string;
    externalMessageId?: string;
    language?: string;
    matchConfidence?: 'verified' | 'possible' | 'unverified';
}
