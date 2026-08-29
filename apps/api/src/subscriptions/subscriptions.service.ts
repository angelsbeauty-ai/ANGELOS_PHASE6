import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import { createHash } from 'crypto';
import type { BillingProvider } from './billing-provider';
import { UnconfiguredBillingProvider } from './billing-provider';

const READ_ONLY_DAYS = 60;

@Injectable()
export class SubscriptionsService {
  private readonly billing: BillingProvider = new UnconfiguredBillingProvider();

  async getStatus(user: AuthUser, workspaceId: string) {
    await this.assertWorkspaceAccess(user, workspaceId);
    const subscription = await this.normalizeSubscription(workspaceId);
    const service = createServiceSupabaseClient();
    const { data: plan, error: planError } = await service.from('subscription_plans').select('*').eq('code', subscription.plan_code).single();
    if (planError || !plan) throw new InternalServerErrorException(planError?.message ?? 'Subscription plan not found');
    const effective = this.calculatePrice(plan, subscription.billing_interval, subscription.discount_percent);
    return {
      subscription,
      plan,
      pricing: effective,
      access: this.accessFor(subscription),
      billingProvider: { name: this.billing.name, configured: this.billing.configured },
      policy: { readOnlyDaysAfterCancellation: READ_ONLY_DAYS, studentDiscountPercent: 20 }
    };
  }

  async selectPlan(user: AuthUser, workspaceId: string, billingInterval: 'monthly' | 'yearly') {
    await this.assertWorkspaceAccess(user, workspaceId);
    const subscription = await this.normalizeSubscription(workspaceId);
    const service = createServiceSupabaseClient();
    const { data: plan, error } = await service.from('subscription_plans').select('*').eq('code', subscription.plan_code).single();
    if (error || !plan) throw new InternalServerErrorException(error?.message ?? 'Subscription plan not found');
    const checkout = await this.billing.createCheckout({ workspaceId, billingInterval, discountPercent: subscription.discount_percent });
    await this.logEvent(workspaceId, user.id, 'checkout_requested', { billingInterval, providerConfigured: this.billing.configured });
    return { checkout, preview: this.calculatePrice(plan, billingInterval, subscription.discount_percent) };
  }

  async cancel(user: AuthUser, workspaceId: string) {
    await this.assertWorkspaceAccess(user, workspaceId);
    const subscription = await this.normalizeSubscription(workspaceId);
    if (subscription.status === 'expired') throw new ConflictException('This workspace subscription is already expired.');
    const now = new Date();
    const readOnlyUntil = new Date(now.getTime() + READ_ONLY_DAYS * 86400000);
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('workspace_subscriptions').update({
      status: 'read_only', cancelled_at: now.toISOString(), read_only_started_at: now.toISOString(), read_only_until: readOnlyUntil.toISOString(), updated_at: now.toISOString()
    }).eq('workspace_id', workspaceId).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    await this.logEvent(workspaceId, user.id, 'cancelled_to_read_only', { readOnlyUntil: readOnlyUntil.toISOString() });
    return data;
  }

  async reactivateDemo(user: AuthUser, workspaceId: string, billingInterval: 'monthly' | 'yearly') {
    if (process.env.BILLING_DEMO_MODE !== 'true' || process.env.NODE_ENV === 'production') {
      throw new ConflictException('Demo billing activation is disabled. Connect a real billing provider for production subscriptions.');
    }
    await this.assertWorkspaceAccess(user, workspaceId);
    const service = createServiceSupabaseClient();
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingInterval === 'yearly') periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
    else periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    const { data, error } = await service.from('workspace_subscriptions').update({
      status: 'active', billing_interval: billingInterval, provider: 'demo', current_period_ends_at: periodEnd.toISOString(), cancelled_at: null, read_only_started_at: null, read_only_until: null, grace_ends_at: null, updated_at: now.toISOString()
    }).eq('workspace_id', workspaceId).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    await this.logEvent(workspaceId, user.id, 'demo_subscription_activated', { billingInterval, currentPeriodEndsAt: periodEnd.toISOString() });
    return data;
  }

  async redeemStudentDiscount(user: AuthUser, workspaceId: string, token: string) {
    await this.assertWorkspaceAccess(user, workspaceId);
    const service = createServiceSupabaseClient();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const { data: invite, error: inviteError } = await service.from('student_discount_invites').select('*').eq('token_hash', tokenHash).maybeSingle();
    if (inviteError) throw new InternalServerErrorException(inviteError.message);
    if (!invite || invite.revoked_at || invite.redeemed_at) throw new NotFoundException('This student discount link is invalid, already used, or revoked.');
    if (invite.email_hint && (!user.email || invite.email_hint.toLowerCase() !== user.email.toLowerCase())) throw new ConflictException('This student discount was issued for a different email address.');
    const now = new Date().toISOString();
    const { data: redeemed, error: updateError } = await service.from('student_discount_invites').update({ redeemed_workspace_id: workspaceId, redeemed_by: user.id, redeemed_at: now }).eq('id', invite.id).is('redeemed_at', null).select('id').maybeSingle();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    if (!redeemed) throw new ConflictException('This student discount was already redeemed.');
    const { data: subscription, error: subscriptionError } = await service.from('workspace_subscriptions').update({ discount_percent: invite.discount_percent, discount_source: 'angels_beauty_student', updated_at: now }).eq('workspace_id', workspaceId).select('*').single();
    if (subscriptionError) throw new InternalServerErrorException(subscriptionError.message);
    await this.logEvent(workspaceId, user.id, 'student_discount_redeemed', { discountPercent: invite.discount_percent });
    return subscription;
  }

  async normalizeSubscription(workspaceId: string) {
    const service = createServiceSupabaseClient();
    const { data: row, error } = await service.from('workspace_subscriptions').select('*').eq('workspace_id', workspaceId).maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!row) throw new NotFoundException('Subscription not found');
    const now = new Date();
    if (row.status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) <= now) {
      const readOnlyUntil = new Date(now.getTime() + READ_ONLY_DAYS * 86400000);
      const { data, error: updateError } = await service.from('workspace_subscriptions').update({ status: 'read_only', read_only_started_at: now.toISOString(), read_only_until: readOnlyUntil.toISOString(), updated_at: now.toISOString() }).eq('workspace_id', workspaceId).select('*').single();
      if (updateError) throw new InternalServerErrorException(updateError.message);
      return data;
    }
    if (row.status === 'read_only' && row.read_only_until && new Date(row.read_only_until) <= now) {
      const { data, error: updateError } = await service.from('workspace_subscriptions').update({ status: 'expired', updated_at: now.toISOString() }).eq('workspace_id', workspaceId).select('*').single();
      if (updateError) throw new InternalServerErrorException(updateError.message);
      return data;
    }
    return row;
  }

  private calculatePrice(plan: any, interval: 'monthly' | 'yearly', discountPercent: number) {
    const baseCents = interval === 'yearly' ? plan.yearly_price_cents : plan.monthly_price_cents;
    const finalCents = Math.round(baseCents * (100 - discountPercent) / 100);
    return { currency: plan.currency, billingInterval: interval, baseCents, discountPercent, finalCents };
  }

  private accessFor(subscription: any) {
    const writeEnabled = ['trialing','active','past_due'].includes(subscription.status);
    return { readEnabled: subscription.status !== 'expired', writeEnabled, aiEnabled: writeEnabled, publishingEnabled: writeEnabled, automationsEnabled: writeEnabled, reason: writeEnabled ? null : subscription.status === 'read_only' ? 'Subscription is in the 60-day read-only period.' : 'Subscription access has expired.' };
  }

  private async assertWorkspaceAccess(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (error || !data) throw new NotFoundException('Workspace not found');
  }

  private async logEvent(workspaceId: string, actorUserId: string | null, eventType: string, details: Record<string, unknown>) {
    const service = createServiceSupabaseClient();
    const { error } = await service.from('subscription_events').insert({ workspace_id: workspaceId, actor_user_id: actorUserId, event_type: eventType, provider: this.billing.name, details });
    if (error) throw new InternalServerErrorException(error.message);
  }
}
