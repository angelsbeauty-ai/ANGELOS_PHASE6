import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('approvals')
@UseGuards(SupabaseAuthGuard)
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  /**
   * FLOW 1: Client Message comes in from n8n → needs Angel approval
   * n8n POST /approvals/message → stores in Supabase → AngelOS gets notified
   */
  @Post('message')
  async createMessageApproval(
    @Body()
    body: {
      sourceId: string; // LINE message ID
      sourceChannel: 'line' | 'instagram' | 'facebook' | 'tiktok';
      content: string; // The actual message/question
      clientId: string;
      clientName: string;
      context?: Record<string, any>;
    },
  ) {
    return this.approvalsService.createMessageApproval({
      type: 'message',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId,
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'reply',
    });
  }

  /**
   * FLOW 2: Content draft from n8n → needs Angel approval before publishing
   * n8n POST /approvals/content → stores in Supabase → AngelOS shows it
   */
  @Post('content')
  async createContentApproval(
    @Body()
    body: {
      sourceId: string; // Content ID
      sourceChannel: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
      content: string; // The caption/post text
      clientId?: string; // Who created it
      clientName: string;
      context?: {
        imageUrl?: string;
        videoUrl?: string;
        platform?: string;
      };
    },
  ) {
    return this.approvalsService.createContentApproval({
      type: 'content',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId || 'system',
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'publish',
    });
  }

  /**
   * FLOW 3: Booking request/change → may need Angel confirmation
   * n8n POST /approvals/booking → stores in Supabase → AngelOS notifies
   */
  @Post('booking')
  async createBookingApproval(
    @Body()
    body: {
      sourceId: string; // Booking ID
      sourceChannel: string; // How it came in (line, form, etc.)
      content: string; // Summary of booking
      clientId: string;
      clientName: string;
      context?: {
        serviceType?: string;
        requestedDate?: string;
        availability?: string[];
      };
    },
  ) {
    return this.approvalsService.createBookingApproval({
      type: 'booking',
      sourceId: body.sourceId,
      sourceChannel: body.sourceChannel,
      content: body.content,
      clientId: body.clientId,
      clientName: body.clientName,
      context: body.context,
      actionRequired: 'confirm',
    });
  }

  /**
   * Angel reviews & makes decision in AngelOS Approval screen
   * AngelOS POST /approvals/decide → decision executes
   */
  @Post('decide')
  async submitDecision(
    @CurrentUser() user: any,
    @Body()
    body: {
      approvalId: string;
      decision: 'approved' | 'rejected' | 'needs_revision';
      notes?: string;
      revisedContent?: string;
    },
  ) {
    return this.approvalsService.submitApprovalDecision(
      {
        approvalId: body.approvalId,
        decision: body.decision,
        notes: body.notes,
        revisedContent: body.revisedContent,
      },
      user.id,
    );
  }

  /**
   * AngelOS Approval screen fetches all pending approvals
   * GET /approvals/pending → returns list for Angel to review
   */
  @Get('pending')
  async getPendingApprovals(@Query('limit') limit = '50') {
    return this.approvalsService.getPendingApprovals(parseInt(limit));
  }

  /**
   * Get single approval details
   */
  @Get(':id')
  async getApprovalById(@Param('id') id: string) {
    return this.approvalsService.getApprovalById(id);
  }

  /**
   * Get approval history/audit log
   */
  @Get('history/list')
  async getHistory(
    @Query('clientId') clientId?: string,
    @Query('type') type?: string,
    @Query('limit') limit = '100',
  ) {
    return this.approvalsService.getApprovalHistory(
      clientId,
      type,
      parseInt(limit),
    );
  }
}
