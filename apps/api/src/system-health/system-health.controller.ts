import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { UpdateOperationalControlsDto } from './dto/update-operational-controls.dto';
import { SystemHealthService } from './system-health.service';

@Controller('workspaces/:workspaceId/system-health')
@UseGuards(SupabaseAuthGuard)
export class SystemHealthController {
  constructor(private readonly health: SystemHealthService) {}

  @Get() overview(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.health.getOverview(user, workspaceId);
  }

  @Post('run') run(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.health.runHealthCheck(user, workspaceId);
  }

  @Get('attention') attention(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.health.listAttention(user, workspaceId);
  }

  @Post('attention/:attentionId/acknowledge') acknowledge(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('attentionId') attentionId: string
  ) {
    return this.health.acknowledgeAttention(user, workspaceId, attentionId);
  }

  @Patch('controls') controls(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateOperationalControlsDto
  ) {
    return this.health.updateControls(user, workspaceId, dto);
  }
}
