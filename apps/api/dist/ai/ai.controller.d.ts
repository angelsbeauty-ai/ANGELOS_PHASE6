import type { AuthUser } from '../auth/auth-user';
import { AiService } from './ai.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';
import { UpdateAssistantProfileDto } from './dto/update-assistant-profile.dto';
import { UpdateAssistantRolesDto } from './dto/update-assistant-roles.dto';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
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
    proposeMemory(user: AuthUser, workspaceId: string, dto: CreateMemoryDto): Promise<any>;
    listMemory(user: AuthUser, workspaceId: string): Promise<{
        id: any;
        category: any;
        content: any;
        status: any;
        created_at: any;
        approved_at: any;
    }[]>;
    approveAction(user: AuthUser, workspaceId: string, actionId: string): Promise<any>;
    cancelAction(user: AuthUser, workspaceId: string, actionId: string): Promise<any>;
    sendVoice(user: AuthUser, workspaceId: string, dto: SendVoiceMessageDto): Promise<import("./ai.service").SendVoiceResult>;
}
