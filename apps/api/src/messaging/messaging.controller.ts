import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { MessagingService } from './messaging.service';
import { CreateDemoChannelDto } from './dto/create-demo-channel.dto';
import { IngestMessageDto } from './dto/ingest-message.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { InternalNoteDto } from './dto/internal-note.dto';
import { TranslateMessageDto } from './dto/translate-message.dto';
import { ReviewClientControlDraftDto } from './dto/review-client-control-draft.dto';

@Controller('workspaces/:workspaceId/messaging')
@UseGuards(SupabaseAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get('channels') listChannels(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.messaging.listChannels(user, workspaceId); }
  @Post('channels/demo') createDemoChannel(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateDemoChannelDto) { return this.messaging.createDemoChannel(user, workspaceId, dto); }
  @Get('client-control/review-queue') getClientControlReviewQueue(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.messaging.getClientControlReviewQueue(user, workspaceId); }
  @Get('client-control/drafts/:messageId') getClientControlReviewDetail(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('messageId') messageId: string) { return this.messaging.getClientControlReviewDetail(user, workspaceId, messageId); }
  @Post('client-control/drafts/:messageId/review') reviewClientControlDraft(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('messageId') messageId: string, @Body() dto: ReviewClientControlDraftDto) { return this.messaging.reviewClientControlDraft(user, workspaceId, messageId, dto); }
  @Get('meta/status') getMetaStatus(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.messaging.getMetaSetupStatus(user, workspaceId); }
  @Get('threads') listThreads(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.messaging.listThreads(user, workspaceId); }
  @Post('threads/:threadId/client-control/stage-draft') stageClientControlDraft(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string) { return this.messaging.stageClientControlDraft(user, workspaceId, threadId); }
  @Get('threads/:threadId/client-control-context') getClientControlContext(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string) { return this.messaging.getClientControlContext(user, workspaceId, threadId); }
  @Get('threads/:threadId') getThread(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string) { return this.messaging.getThread(user, workspaceId, threadId); }
  @Post('ingest-demo') ingestDemo(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: IngestMessageDto) { return this.messaging.ingestDemoMessage(user, workspaceId, dto); }
  @Post('threads/:threadId/ai-draft') draftReply(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string) { return this.messaging.draftReply(user, workspaceId, threadId); }
  @Post('threads/:threadId/replies') createReply(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string, @Body() dto: CreateReplyDto) { return this.messaging.createReply(user, workspaceId, threadId, dto); }
  @Post('messages/:messageId/translate') translateMessage(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('messageId') messageId: string, @Body() dto: TranslateMessageDto) { return this.messaging.translateMessage(user, workspaceId, messageId, dto.targetLanguage); }
  @Post('messages/:messageId/approve-send') approveAndSend(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('messageId') messageId: string) { return this.messaging.approveAndSend(user, workspaceId, messageId); }
  @Post('threads/:threadId/internal-notes') addInternalNote(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string, @Body() dto: InternalNoteDto) { return this.messaging.addInternalNote(user, workspaceId, threadId, dto.content); }
  @Patch('threads/:threadId') updateThread(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('threadId') threadId: string, @Body() dto: UpdateThreadDto) { return this.messaging.updateThread(user, workspaceId, threadId, dto); }
}
