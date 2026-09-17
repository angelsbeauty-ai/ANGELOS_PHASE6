"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FounderService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_1 = require("../config/supabase");
let FounderService = class FounderService {
    async me(user) { return { founder: true, userId: user.id, email: user.email ?? null }; }
    async overview() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const [workspaces, subscriptions, attention, usage, flags] = await Promise.all([
            service.from('workspaces').select('id,name,created_at'),
            service.from('workspace_subscriptions').select('workspace_id,status,billing_interval,discount_percent,trial_ends_at,read_only_until'),
            service.from('attention_items').select('workspace_id,severity,status').in('status', ['open', 'acknowledged']),
            service.from('product_usage_events').select('workspace_id,event_name,screen,feature,duration_ms,created_at').gte('created_at', since),
            service.from('platform_feature_flags').select('*').order('key')
        ]);
        for (const result of [workspaces, subscriptions, attention, usage, flags])
            if (result.error)
                throw new common_1.InternalServerErrorException(result.error.message);
        const subscriptionRows = (subscriptions.data ?? []);
        const attentionRows = (attention.data ?? []);
        const usageRows = (usage.data ?? []);
        const screenStats = new Map();
        for (const event of usageRows) {
            if (!event.screen)
                continue;
            const current = screenStats.get(event.screen) ?? { views: 0, durationMs: 0 };
            if (event.event_name === 'screen_view')
                current.views += 1;
            if (event.event_name === 'screen_duration')
                current.durationMs += Number(event.duration_ms ?? 0);
            screenStats.set(event.screen, current);
        }
        return {
            counts: {
                workspaces: (workspaces.data ?? []).length,
                trialing: subscriptionRows.filter((row) => row.status === 'trialing').length,
                active: subscriptionRows.filter((row) => row.status === 'active').length,
                readOnly: subscriptionRows.filter((row) => row.status === 'read_only').length,
                urgentAttention: attentionRows.filter((row) => row.status === 'open' && row.severity === 'urgent').length
            },
            usage30d: {
                events: usageRows.length,
                activeWorkspaces: new Set(usageRows.map((row) => row.workspace_id)).size,
                topScreens: [...screenStats.entries()].map(([screen, stats]) => ({ screen, ...stats })).sort((a, b) => b.views - a.views).slice(0, 10)
            },
            featureFlags: flags.data ?? []
        };
    }
    async workspaces() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: workspaces, error } = await service.from('workspaces').select('id,name,business_type,timezone,currency,created_at').order('created_at', { ascending: false });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const workspaceRows = (workspaces ?? []);
        const ids = workspaceRows.map((row) => row.id);
        if (!ids.length)
            return [];
        const [{ data: subscriptions, error: subscriptionError }, { data: health, error: healthError }] = await Promise.all([
            service.from('workspace_subscriptions').select('workspace_id,status,billing_interval,discount_percent,trial_ends_at,read_only_until').in('workspace_id', ids),
            service.from('attention_items').select('workspace_id,severity,status').in('workspace_id', ids).in('status', ['open', 'acknowledged'])
        ]);
        if (subscriptionError)
            throw new common_1.InternalServerErrorException(subscriptionError.message);
        if (healthError)
            throw new common_1.InternalServerErrorException(healthError.message);
        const subscriptionRows = (subscriptions ?? []);
        const healthRows = (health ?? []);
        return workspaceRows.map((workspace) => ({
            ...workspace,
            subscription: subscriptionRows.find((row) => row.workspace_id === workspace.id) ?? null,
            attentionCount: healthRows.filter((row) => row.workspace_id === workspace.id && row.status === 'open').length
        }));
    }
    async featureFlags() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('platform_feature_flags').select('*').order('key');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async updateFeatureFlag(user, key, dto) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const updates = { updated_by: user.id, updated_at: new Date().toISOString() };
        if (dto.enabled !== undefined)
            updates.enabled = dto.enabled;
        if (dto.stage !== undefined)
            updates.stage = dto.stage;
        const { data, error } = await service.from('platform_feature_flags').update(updates).eq('key', key).select('*').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Feature flag not found');
        return data;
    }
    async createStudentDiscount(user, dto) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const rawToken = (0, crypto_1.randomBytes)(24).toString('base64url');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        const { data, error } = await service.from('student_discount_invites').insert({
            token_hash: tokenHash,
            email_hint: dto.emailHint ?? null,
            discount_percent: dto.discountPercent ?? 20,
            created_by: user.id
        }).select('id,email_hint,discount_percent,redeemed_at,revoked_at,created_at').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { ...data, token: rawToken };
    }
    async listStudentDiscounts() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('student_discount_invites').select('id,email_hint,discount_percent,redeemed_workspace_id,redeemed_by,redeemed_at,revoked_at,created_at').order('created_at', { ascending: false });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async revokeStudentDiscount(id) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('student_discount_invites').update({ revoked_at: new Date().toISOString() }).eq('id', id).is('redeemed_at', null).select('id,revoked_at').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Unused student discount not found');
        return data;
    }
};
exports.FounderService = FounderService;
exports.FounderService = FounderService = __decorate([
    (0, common_1.Injectable)()
], FounderService);
//# sourceMappingURL=founder.service.js.map