import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RecordFinanceEntryDto } from './dto/record-finance-entry.dto';
import { FinanceService } from './finance.service';

@Controller('workspaces/:workspaceId/finance')
@UseGuards(SupabaseAuthGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('overview') overview(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('days') days?: string) {
    return this.finance.overview(user, workspaceId, Number(days ?? 30));
  }

  @Get('appointments/:appointmentId') appointment(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('appointmentId') appointmentId: string) {
    return this.finance.appointmentSummary(user, workspaceId, appointmentId);
  }

  @Post('entries') record(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: RecordFinanceEntryDto) {
    return this.finance.recordEntry(user, workspaceId, dto);
  }
}
