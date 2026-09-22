import type { AuthUser } from '../auth/auth-user';
import { MessagingService } from './messaging.service';
import { CreateDemoChannelDto } from './dto/create-demo-channel.dto';
import { IngestMessageDto } from './dto/ingest-message.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { InternalNoteDto } from './dto/internal-note.dto';
import { TranslateMessageDto } from './dto/translate-message.dto';
import { ReviewClientControlDraftDto } from './dto/review-client-control-draft.dto';
import { ConnectMetaChannelDto } from './dto/connect-meta-channel.dto';
import { ConnectLineChannelDto } from './dto/connect-line-channel.dto';
export declare class MessagingController {
    private readonly messaging;
    constructor(messaging: MessagingService);
    listChannels(user: AuthUser, workspaceId: string): Promise<any[]>;
    createDemoChannel(user: AuthUser, workspaceId: string, dto: CreateDemoChannelDto): Promise<any>;
    getClientControlReviewQueue(user: AuthUser, workspaceId: string): Promise<any>;
    getClientControlReviewDetail(user: AuthUser, workspaceId: string, messageId: string): Promise<any>;
    reviewClientControlDraft(user: AuthUser, workspaceId: string, messageId: string, dto: ReviewClientControlDraftDto): Promise<any>;
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
    getMetaStatus(user: AuthUser, workspaceId: string): Promise<{
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
    getLineStatus(user: AuthUser, workspaceId: string): Promise<{
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
    stageClientControlDraft(user: AuthUser, workspaceId: string, threadId: string): Promise<any>;
    getClientControlContext(user: AuthUser, workspaceId: string, threadId: string): Promise<any>;
    getThread(user: AuthUser, workspaceId: string, threadId: string): Promise<{
        thread: any;
        messages: any[];
        internalNotes: any[];
    }>;
    ingestDemo(user: AuthUser, workspaceId: string, dto: IngestMessageDto): Promise<{
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
    translateMessage(user: AuthUser, workspaceId: string, messageId: string, dto: TranslateMessageDto): Promise<any>;
    approveAndSend(user: AuthUser, workspaceId: string, messageId: string): Promise<{
        message: any;
        sent: boolean;
        duplicatePrevented: boolean;
    }>;
    addInternalNote(user: AuthUser, workspaceId: string, threadId: string, dto: InternalNoteDto): Promise<any>;
    updateThread(user: AuthUser, workspaceId: string, threadId: string, dto: UpdateThreadDto): Promise<any>;
}
