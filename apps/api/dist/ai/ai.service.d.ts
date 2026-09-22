import type { AuthUser } from '../auth/auth-user';
import { AiProviderService } from './ai-provider.service';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMemoryDto } from './dto/create-memory.dto';
import type { SendAiMessageDto } from './dto/send-ai-message.dto';
import type { UpdateAssistantProfileDto } from './dto/update-assistant-profile.dto';
import type { UpdateAssistantRolesDto } from './dto/update-assistant-roles.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';
export type SendVoiceResult = {
    transcript: string;
    reply: string;
} | {
    error: string;
    status: number;
};
export declare class AiService {
    private readonly provider;
    private readonly logger;
    constructor(provider: AiProviderService);
    getProfile(user: AuthUser, workspaceId: string): Promise<{
        profile: any;
        roles: {
            role_key: any;
            enabled: any;
        }[];
    }>;
    updateProfile(user: AuthUser, workspaceId: string, dto: UpdateAssistantProfileDto): Promise<any>;
    updateRoles(user: AuthUser, workspaceId: string, dto: UpdateAssistantRolesDto): Promise<{
        profile: any;
        roles: {
            role_key: any;
            enabled: any;
        }[];
    }>;
    createConversation(user: AuthUser, workspaceId: string, dto: CreateConversationDto): Promise<any>;
    listMessages(user: AuthUser, workspaceId: string, conversationId: string): Promise<{
        id: any;
        author_type: any;
        content: any;
        metadata: any;
        created_at: any;
    }[]>;
    sendMessage(user: AuthUser, workspaceId: string, conversationId: string, dto: SendAiMessageDto): Promise<{
        message: {
            id: any;
            author_type: any;
            content: any;
            metadata: any;
            created_at: any;
        };
        action: any;
    }>;
    approveAction(user: AuthUser, workspaceId: string, actionId: string): Promise<any>;
    cancelAction(user: AuthUser, workspaceId: string, actionId: string): Promise<any>;
    proposeMemory(user: AuthUser, workspaceId: string, dto: CreateMemoryDto): Promise<any>;
    listMemory(user: AuthUser, workspaceId: string): Promise<{
        id: any;
        category: any;
        content: any;
        status: any;
        created_at: any;
        approved_at: any;
    }[]>;
    sendVoice(_user: AuthUser, _workspaceId: string, dto: SendVoiceMessageDto): Promise<SendVoiceResult>;
    private loadAuthorizedContextFacts;
    private assertWorkspaceAccess;
    private verifyAction;
}
