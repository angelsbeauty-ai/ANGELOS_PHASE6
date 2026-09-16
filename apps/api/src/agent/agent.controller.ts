import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MainAgentService, MainAgentRequest, MainAgentResponse } from '../main-agent.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { LearningRulesService } from '../rules/learning-rules.service';
import { BotRegistry } from '../bot/bot-registry.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../auth/auth-user';

@Controller('workspaces/:workspaceId/agent')
@UseGuards(SupabaseAuthGuard)
export class AgentController {
  constructor(
    private readonly mainAgent: MainAgentService,
    private readonly orchestrator: OrchestratorService,
    private readonly learningRules: LearningRulesService,
    private readonly botRegistry: BotRegistry,
  ) {}

  @Post('chat')
  async chat(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { message: string; context?: Record<string, any> },
  ): Promise<MainAgentResponse> {
    return this.mainAgent.handleRequest({
      workspaceId,
      userMessage: body.message,
      userContext: body.context,
    });
  }

  @Get('tasks')
  async listTasks(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.orchestrator.listTasks(workspaceId, parseInt(limit ?? '50', 10));
  }

  @Get('tasks/:taskId')
  async getTask(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.orchestrator.getTask(taskId);
  }

  @Post('tasks/:taskId/process')
  async processTask(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    // Get the task
    const task = await this.orchestrator.getTask(taskId);

    // If not assigned yet, assign it first
    if (!task.assigned_bot || task.status === 'queued' || task.status === 'awaiting_approval') {
      const assignment = await this.orchestrator.assignTask(taskId);
      // Override task with assignment info
      task.assigned_bot = assignment.bot;
      task.assigned_sub_agent = assignment.subAgent;
      task.status = 'assigned';
    }

    // Execute via bot registry
    if (!task.assigned_bot) {
      throw new Error('No bot assigned to this task');
    }

    await this.botRegistry.executeTask(
      taskId,
      task.assigned_bot as any,
      task.assigned_sub_agent || 'general',
      task.intent,
      task.user_message,
      task.requires_approval,
      workspaceId,
    );

    // Return the updated task
    return this.orchestrator.getTask(taskId);
  }

  @Post('rules/propose')
  async proposeRule(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { ruleText: string; scope: string; scopeValue?: string },
  ) {
    return this.learningRules.proposeRule(
      workspaceId,
      body.ruleText,
      body.scope as any,
      body.scopeValue,
      'user_correction',
    );
  }

  @Post('rules/:ruleId/confirm')
  async confirmRule(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.learningRules.confirmRule(ruleId, user.id);
  }

  @Post('rules/:ruleId/reject')
  async rejectRule(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.learningRules.rejectRule(ruleId);
  }

  @Get('rules')
  async getRules(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Query('bot') bot?: string,
    @Query('scope') scope?: string,
    @Query('scopeValue') scopeValue?: string,
  ) {
    if (bot) return this.learningRules.getRulesForBot(workspaceId, bot);
    if (scope && scopeValue) return this.learningRules.getRulesForScope(workspaceId, scope, scopeValue);
    return this.learningRules.getRules(workspaceId);
  }

  @Get('bots')
  async listBots() {
    const bots = this.botRegistry.getAll();
    const result: any[] = [];
    for (const [name, bot] of bots.entries()) {
      result.push(bot.getBotInfo());
    }
    return result;
  }
}

@Controller('agent/health')
export class AgentHealthController {
  @Get()
  health() {
    return { status: 'ok', component: 'main-agent', phase: 1 };
  }
}
