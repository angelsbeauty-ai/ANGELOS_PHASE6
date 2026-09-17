"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let SubscriptionAccessGuard = exports.SubscriptionAccessGuard = class SubscriptionAccessGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = String(request.method ?? 'GET').toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return true;
        const workspaceId = request.params?.workspaceId;
        if (!workspaceId)
            return true;
        const railwayEnv = String(process.env.RAILWAY_ENVIRONMENT ?? process.env.RAILWAY_ENVIRONMENT_NAME ?? '').toLowerCase();
        const nodeEnv = String(process.env.NODE_ENV ?? '').toLowerCase();
        if (railwayEnv === 'staging' || nodeEnv === 'staging' || process.env.STAGING_ALLOW_WRITES === 'true') {
            return true;
        }
        const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
        if (path.includes('/subscription') || path.includes('/system-health') || path.includes('/product-analytics') || path.includes('/beta/'))
            return true;
        const header = String(request.headers?.authorization ?? '');
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (!token)
            return true;
        const userClient = (0, supabase_1.createUserSupabaseClient)(token);
        const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (!workspace)
            return true;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: subscription } = await service.from('workspace_subscriptions').select('status,trial_ends_at,read_only_until').eq('workspace_id', workspaceId).maybeSingle();
        if (!subscription)
            return true;
        const now = new Date();
        let status = subscription.status;
        if (status === 'trialing' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) <= now) {
            status = 'read_only';
            const readOnlyUntil = new Date(now.getTime() + 60 * 86400000).toISOString();
            await service.from('workspace_subscriptions').update({ status: 'read_only', read_only_started_at: now.toISOString(), read_only_until: readOnlyUntil, updated_at: now.toISOString() }).eq('workspace_id', workspaceId);
        }
        if (status === 'read_only' && subscription.read_only_until && new Date(subscription.read_only_until) <= now) {
            status = 'expired';
            await service.from('workspace_subscriptions').update({ status: 'expired', updated_at: now.toISOString() }).eq('workspace_id', workspaceId);
        }
        if (status === 'read_only' || status === 'expired') {
            throw new common_1.ConflictException(status === 'read_only'
                ? 'AngelOS is in read-only mode for this workspace. Reactivate the subscription to make changes.'
                : 'AngelOS subscription access has expired. Reactivate to resume business actions.');
        }
        return true;
    }
};
exports.SubscriptionAccessGuard = SubscriptionAccessGuard = __decorate([
    (0, common_1.Injectable)()
], SubscriptionAccessGuard);
//# sourceMappingURL=subscription-access.guard.js.map