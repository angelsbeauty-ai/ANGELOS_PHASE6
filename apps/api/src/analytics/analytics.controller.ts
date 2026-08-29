import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RecordAudienceActivityDto } from './dto/record-audience-activity.dto';
import { RecordContentMetricsDto } from './dto/record-content-metrics.dto';
import { UpdateMarketingProfileDto } from './dto/update-marketing-profile.dto';

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('days') days?: string) {
    return this.analytics.overview(user, workspaceId, Number(days ?? 30));
  }

  @Get('marketing-profile')
  getMarketingProfile(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.analytics.getMarketingProfile(user, workspaceId);
  }

  @Patch('marketing-profile')
  updateMarketingProfile(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: UpdateMarketingProfileDto) {
    return this.analytics.updateMarketingProfile(user, workspaceId, dto);
  }

  @Post('content/:variantId/metrics')
  recordContentMetrics(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('variantId') variantId: string, @Body() dto: RecordContentMetricsDto) {
    return this.analytics.recordContentMetrics(user, workspaceId, variantId, dto);
  }

  @Post('audience-activity')
  recordAudienceActivity(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: RecordAudienceActivityDto) {
    return this.analytics.recordAudienceActivity(user, workspaceId, dto);
  }

  @Post('marketing-coach')
  marketingCoach(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('days') days?: string) {
    return this.analytics.marketingCoach(user, workspaceId, Number(days ?? 30));
  }
}
