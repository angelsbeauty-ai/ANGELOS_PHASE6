import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { HermesTaskService } from './hermes-task.service';
import { HermesControlService } from './hermes-control.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';

@Controller('workspaces/:workspaceId/hermes')
@UseGuards(SupabaseAuthGuard)
export class HermesControlController {
  constructor(
    private readonly hermesTask: HermesTaskService,
    private readonly hermesControl: HermesControlService
  ) {}

  @Post('tasks')
  async createTask(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() body: {
      source_ref?: string; source?: string; source_channel?: string;
      intent: string; task_text: string; task_json?: Record<string, any>;
      needs_owner_approval?: boolean; n8n_execution_id?: string; n8n_callback_url?: string
    }
  ) {
    return this.hermesTask.create(user, body);
  }

  @Get('tasks')
  async listTasks(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('limit') limit?: string) {
    return this.hermesTask.listRecent(user, parseInt(limit ?? '50', 10));
  }

  @Get('tasks/:taskId')
  async getTask(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string) {
    return this.hermesTask.getOne(user, taskId);
  }

  @Post('tasks/:taskId/approve')
  async approveTask(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string) {
    return this.hermesTask.updateStatus(user, taskId, {
      approval_status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    });
  }

  @Post('tasks/:taskId/result')
  async recordResult(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string, @Body() body: { result?: Record<string, any>; error?: string; hermes_session_id?: string }) {
    return this.hermesTask.updateStatus(user, taskId, {
      status: body.error ? 'failed' : 'done',
      hermes_result: body.result,
      hermes_error: body.error,
      hermes_session_id: body.hermes_session_id,
      hermes_finished_at: new Date().toISOString()
    });
  }

  @Get('overview')
  async getOverview(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.hermesControl.getOverviewAsSystem(workspaceId);
  }
}
