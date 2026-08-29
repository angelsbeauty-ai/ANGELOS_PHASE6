import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AutomationsService } from './automations.service';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

@Controller('workspaces/:workspaceId/automations')
@UseGuards(SupabaseAuthGuard)
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}
  @Post('seed-defaults') seed(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.automations.seedDefaults(user, workspaceId); }
  @Get('rules') rules(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.automations.listRules(user, workspaceId); }
  @Patch('rules/:ruleId') updateRule(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('ruleId') ruleId: string, @Body() dto: UpdateAutomationRuleDto) { return this.automations.updateRule(user, workspaceId, ruleId, dto); }
  @Get('jobs') jobs(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.automations.listJobs(user, workspaceId); }
  @Post('process-due') process(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('limit') limit?: string) { return this.automations.processDue(user, workspaceId, Number(limit ?? 20)); }
}
