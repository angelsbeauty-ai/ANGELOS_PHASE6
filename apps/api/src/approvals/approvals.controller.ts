import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';

/**
 * Routes stay flat (/approvals/*) so the existing n8n workflows keep working.
 * Workspace scoping is resolved server-side from the caller's membership, or from an
 * explicit workspaceId in the body/query when the account has more than one workspace.
 */
@Controller('approvals')
@UseGuards(SupabaseAuthGuard)
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  /**
   * FLOW 1: inbound client message from n8n that needs Angel's approval.
   */
  @Post('message')
  async createMessageApproval(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      sourceId: string;
      sourceChannel: 'line' | 'instagram' | 'facebook' | 'tiktok' | 'manual';
      content: string;
      clientId: string;
      clientName: string;
      context?: Record<string, any>;
      workspaceId?: string;
    }
  ) {
    return this.approvalsService.createMessageApproval(user, {
      type: 'message',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId,
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'reply',
      workspaceId: body.workspaceId
    });
  }

  /**
   * FLOW 2: content draft that needs approval before publishing.
   */
  @Post('content')
  async createContentApproval(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      sourceId: string;
      sourceChannel: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
      content: string;
      clientId?: string;
      clientName: string;
      context?: { imageUrl?: string; videoUrl?: string; platform?: string };
      workspaceId?: string;
    }
  ) {
    return this.approvalsService.createContentApproval(user, {
      type: 'content',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId || 'system',
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'publish',
      workspaceId: body.workspaceId
    });
  }

  /**
   * FLOW 3: booking request/change that may need confirmation.
   */
  @Post('booking')
  async createBookingApproval(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      sourceId: string;
      sourceChannel: string;
      content: string;
      clientId: string;
      clientName: string;
      context?: { serviceType?: string; requestedDate?: string; availability?: string[] };
      workspaceId?: string;
    }
  ) {
    return this.approvalsService.createBookingApproval(user, {
      type: 'booking',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId,
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'confirm',
      workspaceId: body.workspaceId
    });
  }

  /**
   * Angel's decision from the AngelOS Approvals screen.
   */
  @Post('decide')
  async submitDecision(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      approvalId: string;
      decision: 'approved' | 'rejected' | 'needs_revision';
      notes?: string;
      revisedContent?: string;
      workspaceId?: string;
    }
  ) {
    return this.approvalsService.submitApprovalDecision(
      user,
      {
        approvalId: body.approvalId,
        decision: body.decision,
        notes: body.notes,
        revisedContent: body.revisedContent
      },
      body.workspaceId
    );
  }

  /**
   * Pending approvals for the Approvals screen.
   */
  @Get('pending')
  async getPendingApprovals(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit = '50',
    @Query('workspaceId') workspaceId?: string
  ) {
    return this.approvalsService.getPendingApprovals(user, parseInt(limit, 10), workspaceId);
  }

  @Post(':id/execute')
  executeMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { workspaceId?: string }) {
    return this.approvalsService.executeMessageApproval(user, id, body.workspaceId);
  }

  /**
   * Decision audit log. Declared before :id so the literal path wins.
   */
  @Get('history/list')
  async getHistory(
    @CurrentUser() user: AuthUser,
    @Query('clientId') clientId?: string,
    @Query('type') type?: string,
    @Query('limit') limit = '100',
    @Query('workspaceId') workspaceId?: string
  ) {
    return this.approvalsService.getApprovalHistory(user, clientId, type, parseInt(limit, 10), workspaceId);
  }

  @Get(':id')
  async getApprovalById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    return this.approvalsService.getApprovalById(user, id, workspaceId);
  }
}
