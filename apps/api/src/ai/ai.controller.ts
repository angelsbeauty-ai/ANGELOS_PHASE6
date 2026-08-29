import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AiService } from './ai.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';
import { UpdateAssistantProfileDto } from './dto/update-assistant-profile.dto';
import { UpdateAssistantRolesDto } from './dto/update-assistant-roles.dto';

@Controller('workspaces/:workspaceId/ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.ai.getProfile(user, workspaceId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateAssistantProfileDto
  ) {
    return this.ai.updateProfile(user, workspaceId, dto);
  }

  @Put('roles')
  updateRoles(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateAssistantRolesDto
  ) {
    return this.ai.updateRoles(user, workspaceId, dto);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateConversationDto
  ) {
    return this.ai.createConversation(user, workspaceId, dto);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string
  ) {
    return this.ai.listMessages(user, workspaceId, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendAiMessageDto
  ) {
    return this.ai.sendMessage(user, workspaceId, conversationId, dto);
  }

  @Post('actions/:actionId/approve')
  approveAction(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('actionId') actionId: string
  ) {
    return this.ai.approveAction(user, workspaceId, actionId);
  }

  @Post('actions/:actionId/cancel')
  cancelAction(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('actionId') actionId: string
  ) {
    return this.ai.cancelAction(user, workspaceId, actionId);
  }

  @Get('memory')
  listMemory(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.ai.listMemory(user, workspaceId);
  }

  @Post('memory')
  proposeMemory(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateMemoryDto
  ) {
    return this.ai.proposeMemory(user, workspaceId, dto);
  }
}
