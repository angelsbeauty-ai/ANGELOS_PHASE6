import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { HermesSystemService } from './hermes-system.service';
import { HermesControlService } from './hermes-control.service';
import { HermesBuilderExecutor } from './hermes-builder-executor.service';
import { N8nSecretGuard } from '../common/guards/n8nsecret.guard';

/**
 * n8n-specific Hermes endpoints — shared-secret protected, no Bearer token required.
 *
 * n8n calls these endpoints with X-N8N-Secret header.
 * N8N_HERMES_SECRET must be set in Railway env vars.
 *
 * These endpoints:
 * - Create Hermes tasks from Telegram messages (build/fix/review intents)
 * - Get overview/status for /status command
 * - Trigger Hermes Builder execution
 *
 * All other Hermes endpoints (in hermes-control.controller.ts) remain
 * SupabaseAuthGuard-protected for human API clients.
 */
@Controller('workspaces/:workspaceId/hermes/n8n')
@UseGuards(N8nSecretGuard)
export class N8nHermesController {
  constructor(
    private readonly systemTaskService: HermesSystemService,
    private readonly controlService: HermesControlService,
    private readonly builderExecutor: HermesBuilderExecutor
  ) {}

  /**
   * Create a Hermes task from an n8n/Telegram message.
   * Called when intent is build/fix/review.
   */
  @Post('tasks')
  async createTask(
    @Param('workspaceId') workspaceIdParam: string,
    @Body() body: {
      source_ref?: string;
      source?: string;
      source_channel?: string;
      intent: string;
      task_text: string;
      task_json?: Record<string, any>;
      needs_owner_approval?: boolean;
      n8n_execution_id?: string;
      n8n_callback_url?: string;
    }
  ) {
    const workspaceId = workspaceIdParam || 'default';
    return this.systemTaskService.createAsSystem(workspaceId, body, body.n8n_execution_id);
  }

  /**
   * Get overview/status for /status command.
   * Returns pending approvals + attention items + system health.
   * Accepts both POST (with body) and GET (with query param or path param).
   */
  @Post('overview')
  async overviewPost(@Body() body: { workspaceId?: string } | undefined) {
    const workspaceId = body?.workspaceId ?? 'default';
    return this.controlService.getOverviewAsSystem(workspaceId);
  }

  @Get('overview')
  async overviewGet(
    @Query('workspaceId') workspaceIdQuery?: string,
    @Param('workspaceId') workspaceIdParam?: string
  ) {
    const workspaceId = workspaceIdQuery ?? workspaceIdParam ?? 'default';
    return this.controlService.getOverviewAsSystem(workspaceId);
  }

  /**
   * Trigger Hermes Builder to execute a task.
   * n8n calls this after creating a task.
   */
  @Post('execute')
  async execute(@Body() body: { taskId: string; model?: string; timeoutMs?: number }) {
    return this.builderExecutor.execute(body);
  }
}
