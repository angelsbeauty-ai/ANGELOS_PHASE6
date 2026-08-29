import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ChangePlanDto } from './dto/change-plan.dto';
import { RedeemStudentDiscountDto } from './dto/redeem-student-discount.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('workspaces/:workspaceId/subscription')
@UseGuards(SupabaseAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}
  @Get() status(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.subscriptions.getStatus(user, workspaceId); }
  @Post('checkout') checkout(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: ChangePlanDto) { return this.subscriptions.selectPlan(user, workspaceId, dto.billingInterval); }
  @Post('cancel') cancel(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) { return this.subscriptions.cancel(user, workspaceId); }
  @Post('reactivate-demo') reactivateDemo(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: ChangePlanDto) { return this.subscriptions.reactivateDemo(user, workspaceId, dto.billingInterval); }
  @Post('student-discount') studentDiscount(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: RedeemStudentDiscountDto) { return this.subscriptions.redeemStudentDiscount(user, workspaceId, dto.token); }
}
