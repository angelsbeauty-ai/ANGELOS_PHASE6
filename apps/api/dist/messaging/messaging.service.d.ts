import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from '../ai/ai-provider.service';
import type { CreateDemoChannelDto } from './dto/create-demo-channel.dto';
import type { IngestMessageDto } from './dto/ingest-message.dto';
import type { CreateReplyDto } from './dto/create-reply.dto';
import type { UpdateThreadDto } from './dto/update-thread.dto';
import type { ReviewClientControlDraftDto } from './dto/review-client-control-draft.dto';
import type { ConnectMetaChannelDto } from './dto/connect-meta-channel.dto';
import type { ConnectLineChannelDto } from './dto/connect-line-channel.dto';
import { StagingMessageExecutionService } from './staging-message-execution.service';
export declare class MessagingService {
    private readonly aiProvider;
    private readonly stagingExecution?;
    private readonly manualAdapter;
    constructor(aiProvider: AiProviderService, stagingExecution?: StagingMessageExecutionService | undefined);
    private getWorkspaceMembership;
    private getClientControlDraft;
    getClientControlReviewQueue(user: AuthUser, workspaceId: string): Promise<any>;
    getClientControlContext(user: AuthUser, workspaceId: string, threadId: string): Promise<any>;
    getClientControlReviewDetail(user: AuthUser, workspaceId: string, messageId: string): Promise<any>;
    reviewClientControlDraft(user: AuthUser, workspaceId: string, messageId: string, dto: ReviewClientControlDraftDto): Promise<any>;
    stageClientControlDraft(user: AuthUser, workspaceId: string, threadId: string): Promise<any>;
    listChannels(user: AuthUser, workspaceId: string): Promise<any[]>;
    createDemoChannel(user: AuthUser, workspaceId: string, dto: CreateDemoChannelDto): Promise<any>;
    connectMetaChannel(user: AuthUser, workspaceId: string, dto: ConnectMetaChannelDto): Promise<{
        channel: {
            id: any;
            provider: any;
            display_name: any;
            external_account_id: any;
            status: any;
        };
        credential: {
            provider: "instagram" | "facebook";
            status: string;
            expiresAt: string;
            tokenStored: boolean;
        };
        sendingEnabled: boolean;
    }>;
    disconnectMetaChannel(user: AuthUser, workspaceId: string, provider: 'instagram' | 'facebook'): Promise<{
        provider: "instagram" | "facebook";
        channelsDisconnected: number;
        credentialsRevoked: number;
    }>;
    connectLineChannel(user: AuthUser, workspaceId: string, dto: ConnectLineChannelDto): Promise<{
        channel: {
            id: any;
            provider: any;
            display_name: any;
            external_account_id: any;
            status: any;
        };
        credential: {
            provider: string;
            status: string;
            expiresAt: string;
            tokenStored: boolean;
        };
        sendingEnabled: boolean;
    }>;
    disconnectLineChannel(user: AuthUser, workspaceId: string): Promise<{
        provider: string;
        channelsDisconnected: number;
        credentialsRevoked: number;
    }>;
    getLineSetupStatus(user: AuthUser, workspaceId: string): Promise<{
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
    listThreads(user: AuthUser, workspaceId: string): Promise<any[]>;
    getThread(user: AuthUser, workspaceId: string, threadId: string): Promise<{
        thread: any;
        messages: any[];
        internalNotes: any[];
    }>;
    ingestDemoMessage(user: AuthUser, workspaceId: string, dto: IngestMessageDto): Promise<{
        threadId: string | undefined;
        message: any;
        intent: string;
        sensitive: boolean;
        phishing: boolean;
        priority: string;
        clientId: string | null;
    }>;
    draftReply(user: AuthUser, workspaceId: string, threadId: string): Promise<{
        message: any;
        approval: any;
        requiresApproval: boolean;
        reason: string;
    } | {
        message: any;
        requiresApproval: boolean;
        reason: string;
        approval?: undefined;
    }>;
    createReply(user: AuthUser, workspaceId: string, threadId: string, dto: CreateReplyDto): Promise<{
        message: any;
        sent: boolean;
        duplicatePrevented: boolean;
    } | {
        message: any;
        sent: boolean;
    }>;
    approveAndSend(user: AuthUser, workspaceId: string, messageId: string): Promise<{
        message: any;
        sent: boolean;
        duplicatePrevented: boolean;
    }>;
    translateMessage(user: AuthUser, workspaceId: string, messageId: string, targetLanguage: string): Promise<any>;
    addInternalNote(user: AuthUser, workspaceId: string, threadId: string, content: string): Promise<any>;
    updateThread(user: AuthUser, workspaceId: string, threadId: string, dto: UpdateThreadDto): Promise<any>;
    private sendMessage;
    getMetaSetupStatus(user: AuthUser, workspaceId: string): Promise<{
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
    private resolveAdapter;
    ingestMetaMessage(workspaceId: string, channelId: string, externalUserId: string, externalMessageId: string, body: string): Promise<{
        deduplicated: boolean;
        skipped: boolean;
        threadId?: undefined;
        messageId?: undefined;
    } | {
        deduplicated: boolean;
        skipped?: undefined;
        threadId?: undefined;
        messageId?: undefined;
    } | {
        deduplicated: boolean;
        threadId: string | undefined;
        messageId: any;
        skipped?: undefined;
    }>;
}
