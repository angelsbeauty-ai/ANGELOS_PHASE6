import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { TrackProductEventDto } from './dto/track-product-event.dto';
import { ProductAnalyticsService } from './product-analytics.service';
@Controller('workspaces/:workspaceId/product-analytics')
@UseGuards(SupabaseAuthGuard)
export class ProductAnalyticsController {
  constructor(private readonly analytics: ProductAnalyticsService) {}
  @Post('events') track(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: TrackProductEventDto) { return this.analytics.track(user, workspaceId, dto); }
}
