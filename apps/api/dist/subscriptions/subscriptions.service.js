"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const crypto_1 = require("crypto");
const billing_provider_1 = require("./billing-provider");
const READ_ONLY_DAYS = 60;
let SubscriptionsService = exports.SubscriptionsService = class SubscriptionsService {
    billing = new billing_provider_1.UnconfiguredBillingProvider();
    async getStatus(user, workspaceId) {
        await this.assertWorkspaceAccess(user, workspaceId);
        const subscription = await this.normalizeSubscription(workspaceId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: plan, error: planError } = await service.from('subscription_plans').select('*').eq('code', subscription.plan_code).single();
        if (planError || !plan)
            throw new common_1.InternalServerErrorException(planError?.message ?? 'Subscription plan not found');
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
    async selectPlan(user, workspaceId, billingInterval) {
        await this.assertWorkspaceAccess(user, workspaceId);
        const subscription = await this.normalizeSubscription(workspaceId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: plan, error } = await service.from('subscription_plans').select('*').eq('code', subscription.plan_code).single();
        if (error || !plan)
            throw new common_1.InternalServerErrorException(error?.message ?? 'Subscription plan not found');
        const checkout = await this.billing.createCheckout({ workspaceId, billingInterval, discountPercent: subscription.discount_percent });
        await this.logEvent(workspaceId, user.id, 'checkout_requested', { billingInterval, providerConfigured: this.billing.configured });
        return { checkout, preview: this.calculatePrice(plan, billingInterval, subscription.discount_percent) };
    }
    async cancel(user, workspaceId) {
        await this.assertWorkspaceAccess(user, workspaceId);
        const subscription = await this.normalizeSubscription(workspaceId);
        if (subscription.status === 'expired')
            throw new common_1.ConflictException('This workspace subscription is already expired.');
        const now = new Date();
        const readOnlyUntil = new Date(now.getTime() + READ_ONLY_DAYS * 86400000);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('workspace_subscriptions').update({
            status: 'read_only', cancelled_at: now.toISOString(), read_only_started_at: now.toISOString(), read_only_until: readOnlyUntil.toISOString(), updated_at: now.toISOString()
        }).eq('workspace_id', workspaceId).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        await this.logEvent(workspaceId, user.id, 'cancelled_to_read_only', { readOnlyUntil: readOnlyUntil.toISOString() });
        return data;
    }
    async reactivateDemo(user, workspaceId, billingInterval) {
        if (process.env.BILLING_DEMO_MODE !== 'true' || process.env.NODE_ENV === 'production') {
            throw new common_1.ConflictException('Demo billing activation is disabled. Connect a real billing provider for production subscriptions.');
        }
        await this.assertWorkspaceAccess(user, workspaceId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingInterval === 'yearly')
            periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
        else
            periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
        const { data, error } = await service.from('workspace_subscriptions').update({
            status: 'active', billing_interval: billingInterval, provider: 'demo', current_period_ends_at: periodEnd.toISOString(), cancelled_at: null, read_only_started_at: null, read_only_until: null, grace_ends_at: null, updated_at: now.toISOString()
        }).eq('workspace_id', workspaceId).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        await this.logEvent(workspaceId, user.id, 'demo_subscription_activated', { billingInterval, currentPeriodEndsAt: periodEnd.toISOString() });
        return data;
    }
    async redeemStudentDiscount(user, workspaceId, token) {
        await this.assertWorkspaceAccess(user, workspaceId);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const { data: invite, error: inviteError } = await service.from('student_discount_invites').select('*').eq('token_hash', tokenHash).maybeSingle();
        if (inviteError)
            throw new common_1.InternalServerErrorException(inviteError.message);
        if (!invite || invite.revoked_at || invite.redeemed_at)
            throw new common_1.NotFoundException('This student discount link is invalid, already used, or revoked.');
        if (invite.email_hint && (!user.email || invite.email_hint.toLowerCase() !== user.email.toLowerCase()))
            throw new common_1.ConflictException('This student discount was issued for a different email address.');
        const now = new Date().toISOString();
        const { data: redeemed, error: updateError } = await service.from('student_discount_invites').update({ redeemed_workspace_id: workspaceId, redeemed_by: user.id, redeemed_at: now }).eq('id', invite.id).is('redeemed_at', null).select('id').maybeSingle();
        if (updateError)
            throw new common_1.InternalServerErrorException(updateError.message);
        if (!redeemed)
            throw new common_1.ConflictException('This student discount was already redeemed.');
        const { data: subscription, error: subscriptionError } = await service.from('workspace_subscriptions').update({ discount_percent: invite.discount_percent, discount_source: 'angels_beauty_student', updated_at: now }).eq('workspace_id', workspaceId).select('*').single();
        if (subscriptionError)
            throw new common_1.InternalServerErrorException(subscriptionError.message);
        await this.logEvent(workspaceId, user.id, 'student_discount_redeemed', { discountPercent: invite.discount_percent });
        return subscription;
    }
    async normalizeSubscription(workspaceId) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: row, error } = await service.from('workspace_subscriptions').select('*').eq('workspace_id', workspaceId).maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!row)
            throw new common_1.NotFoundException('Subscription not found');
        const now = new Date();
        if (row.status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) <= now) {
            const readOnlyUntil = new Date(now.getTime() + READ_ONLY_DAYS * 86400000);
            const { data, error: updateError } = await service.from('workspace_subscriptions').update({ status: 'read_only', read_only_started_at: now.toISOString(), read_only_until: readOnlyUntil.toISOString(), updated_at: now.toISOString() }).eq('workspace_id', workspaceId).select('*').single();
            if (updateError)
                throw new common_1.InternalServerErrorException(updateError.message);
            return data;
        }
        if (row.status === 'read_only' && row.read_only_until && new Date(row.read_only_until) <= now) {
            const { data, error: updateError } = await service.from('workspace_subscriptions').update({ status: 'expired', updated_at: now.toISOString() }).eq('workspace_id', workspaceId).select('*').single();
            if (updateError)
                throw new common_1.InternalServerErrorException(updateError.message);
            return data;
        }
        return row;
    }
    calculatePrice(plan, interval, discountPercent) {
        const baseCents = interval === 'yearly' ? plan.yearly_price_cents : plan.monthly_price_cents;
        const finalCents = Math.round(baseCents * (100 - discountPercent) / 100);
        return { currency: plan.currency, billingInterval: interval, baseCents, discountPercent, finalCents };
    }
    accessFor(subscription) {
        const writeEnabled = ['trialing', 'active', 'past_due'].includes(subscription.status);
        return { readEnabled: subscription.status !== 'expired', writeEnabled, aiEnabled: writeEnabled, publishingEnabled: writeEnabled, automationsEnabled: writeEnabled, reason: writeEnabled ? null : subscription.status === 'read_only' ? 'Subscription is in the 60-day read-only period.' : 'Subscription access has expired.' };
    }
    async assertWorkspaceAccess(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (error || !data)
            throw new common_1.NotFoundException('Workspace not found');
    }
    async logEvent(workspaceId, actorUserId, eventType, details) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { error } = await service.from('subscription_events').insert({ workspace_id: workspaceId, actor_user_id: actorUserId, event_type: eventType, provider: this.billing.name, details });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
    }
};
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)()
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map