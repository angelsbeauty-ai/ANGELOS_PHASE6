import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { BetaService } from './beta.service';
import { RedeemBetaInviteDto } from './dto/redeem-beta-invite.dto';
import { SubmitBetaFeedbackDto } from './dto/submit-beta-feedback.dto';

@Controller('beta')
@UseGuards(SupabaseAuthGuard)
export class BetaController {
  constructor(private readonly beta: BetaService) {}
  @Get('me') me(@CurrentUser() user: AuthUser) { return this.beta.me(user); }
  @Post('redeem') redeem(@CurrentUser() user: AuthUser, @Body() dto: RedeemBetaInviteDto) { return this.beta.redeem(user, dto); }
  @Post('workspaces/:workspaceId/feedback') feedback(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: SubmitBetaFeedbackDto) { return this.beta.submitFeedback(user, workspaceId, dto); }
}
