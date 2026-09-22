"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_1 = require("../config/supabase");
let BetaService = exports.BetaService = class BetaService {
    async isFounder(userId) {
        const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
        const service = (0, supabase_1.createServiceSupabaseClient)();
        if (envFounders.includes(userId)) {
            const { error } = await service.from('platform_founders').upsert({ user_id: userId, label: 'Environment Founder' }, { onConflict: 'user_id' });
            if (error)
                throw new common_1.InternalServerErrorException(error.message);
            return true;
        }
        const { data, error } = await service.from('platform_founders').select('user_id').eq('user_id', userId).maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return Boolean(data);
    }
    async me(user) {
        if (await this.isFounder(user.id))
            return { approved: true, founderBypass: true, cohort: 'angels_beauty', workspaceId: null };
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('beta_testers').select('cohort,approved_at,workspace_id,revoked_at').eq('user_id', user.id).maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { approved: Boolean(data && !data.revoked_at), founderBypass: false, cohort: data?.cohort ?? null, approvedAt: data?.approved_at ?? null, workspaceId: data?.workspace_id ?? null };
    }
    async ensureCanCreateWorkspace(user) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: release, error } = await service.from('platform_release_state').select('stage,public_signup_enabled').eq('id', 'main').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (release?.public_signup_enabled || release?.stage === 'public')
            return;
        const access = await this.me(user);
        if (!access.approved)
            throw new common_1.ForbiddenException('AngelOS is currently invite-only. Redeem a founder-approved beta invite before creating a business workspace.');
    }
    async redeem(user, dto) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(dto.token.trim()).digest('hex');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.rpc('redeem_beta_invite', { p_token_hash: tokenHash, p_user_id: user.id, p_user_email: user.email ?? '' });
        if (error) {
            const message = String(error.message ?? '');
            if (message.includes('expired_beta_invite'))
                throw new common_1.ConflictException('Beta invite has expired.');
            if (message.includes('beta_invite_email_mismatch'))
                throw new common_1.ForbiddenException('This beta invite was approved for a different email address.');
            if (message.includes('invalid_beta_invite'))
                throw new common_1.NotFoundException('Beta invite is invalid, revoked, or already used.');
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async submitFeedback(user, workspaceId, dto) {
        const client = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: workspace, error: workspaceError } = await client.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (workspaceError)
            throw new common_1.InternalServerErrorException(workspaceError.message);
        if (!workspace)
            throw new common_1.NotFoundException('Workspace not found.');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('beta_feedback').insert({
            workspace_id: workspaceId,
            user_id: user.id,
            category: dto.category,
            message: dto.message.trim(),
            rating: dto.rating ?? null,
            permission_to_contact: dto.permissionToContact ?? false,
            permission_to_quote: dto.permissionToQuote ?? false
        }).select('id,category,rating,permission_to_contact,permission_to_quote,status,created_at').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data;
    }
    async createInvite(user, dto) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const rawToken = (0, crypto_1.randomBytes)(24).toString('base64url');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        const expiresAt = dto.expiresInDays ? new Date(Date.now() + dto.expiresInDays * 86400000).toISOString() : null;
        const { data, error } = await service.from('beta_invites').insert({ token_hash: tokenHash, email_hint: dto.emailHint ?? null, cohort: dto.cohort ?? 'outside', label: dto.label ?? null, region: dto.region ?? null, created_by: user.id, expires_at: expiresAt }).select('id,email_hint,cohort,label,region,expires_at,redeemed_at,revoked_at,created_at').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { ...data, token: rawToken };
    }
    async listInvites() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('beta_invites').select('id,email_hint,cohort,label,region,expires_at,redeemed_by,redeemed_at,revoked_at,created_at').order('created_at', { ascending: false });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async revokeInvite(id) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('beta_invites').update({ revoked_at: new Date().toISOString() }).eq('id', id).is('redeemed_at', null).select('id,revoked_at').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Unused beta invite not found.');
        return data;
    }
    async revokeTester(userId) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const now = new Date();
        const { data: tester, error } = await service.from('beta_testers').update({ revoked_at: now.toISOString() }).eq('user_id', userId).is('revoked_at', null).select('user_id,workspace_id,cohort,revoked_at').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!tester)
            throw new common_1.NotFoundException('Active beta tester not found.');
        if (tester.workspace_id) {
            const { data: downgraded, error: downgradeError } = await service
                .from('workspace_subscriptions')
                .update({ status: 'read_only', read_only_started_at: now.toISOString(), read_only_until: new Date(now.getTime() + 60 * 86400000).toISOString(), updated_at: now.toISOString() })
                .eq('workspace_id', tester.workspace_id)
                .eq('status', 'trialing')
                .select('workspace_id,status')
                .maybeSingle();
            if (downgradeError)
                throw new common_1.InternalServerErrorException(downgradeError.message);
            if (downgraded) {
                const { error: eventError } = await service.from('subscription_events').insert({
                    workspace_id: tester.workspace_id,
                    event_type: 'beta_revoked',
                    details: { toStatus: 'read_only', reason: 'Beta tester access revoked by founder.' }
                });
                if (eventError)
                    throw new common_1.InternalServerErrorException(eventError.message);
            }
            return { ...tester, subscriptionDowngraded: Boolean(downgraded) };
        }
        return tester;
    }
    async listFeedback() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data, error } = await service.from('beta_feedback').select('id,workspace_id,category,message,rating,permission_to_contact,permission_to_quote,status,founder_note,created_at,updated_at').order('created_at', { ascending: false }).limit(200);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async updateFeedback(id, dto) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const patch = { updated_at: new Date().toISOString() };
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.founderNote !== undefined)
            patch.founder_note = dto.founderNote;
        const { data, error } = await service.from('beta_feedback').update(patch).eq('id', id).select('*').maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.NotFoundException('Beta feedback not found.');
        return data;
    }
    async overview() {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
        const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
        const [testers, usage7d, usage30d, feedback, attention, release] = await Promise.all([
            service.from('beta_testers').select('user_id,cohort,workspace_id,approved_at,revoked_at'),
            service.from('product_usage_events').select('workspace_id,event_name,feature,created_at').gte('created_at', since7d),
            service.from('product_usage_events').select('workspace_id,event_name,feature,created_at').gte('created_at', since30d),
            service.from('beta_feedback').select('category,rating,permission_to_quote,status,created_at'),
            service.from('attention_items').select('severity,status').in('status', ['open', 'acknowledged']),
            service.from('platform_release_state').select('*').eq('id', 'main').maybeSingle()
        ]);
        for (const result of [testers, usage7d, usage30d, feedback, attention, release])
            if (result.error)
                throw new common_1.InternalServerErrorException(result.error.message);
        const testerRows = (testers.data ?? []);
        const usage7dRows = (usage7d.data ?? []);
        const usage30dRows = (usage30d.data ?? []);
        const feedbackRows = (feedback.data ?? []);
        const attentionRows = (attention.data ?? []);
        const activeTesters = testerRows.filter((row) => !row.revoked_at);
        const outsideWorkspaceIds = new Set(activeTesters.filter((row) => row.cohort === 'outside' && row.workspace_id).map((row) => row.workspace_id));
        const activeOutside7d = new Set(usage7dRows.filter((row) => row.workspace_id && outsideWorkspaceIds.has(row.workspace_id)).map((row) => row.workspace_id)).size;
        const activeOutside30d = new Set(usage30dRows.filter((row) => row.workspace_id && outsideWorkspaceIds.has(row.workspace_id)).map((row) => row.workspace_id)).size;
        const ratings = feedbackRows.map((row) => Number(row.rating)).filter((value) => Number.isFinite(value));
        const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
        const urgentOpen = attentionRows.filter((row) => row.status === 'open' && row.severity === 'urgent').length;
        const testimonialCandidates = feedbackRows.filter((row) => row.category === 'testimonial_candidate' && row.permission_to_quote).length;
        const criteria = [
            { key: 'outside_testers', label: '20+ outside businesses approved', pass: outsideWorkspaceIds.size >= 20, current: outsideWorkspaceIds.size, target: 20 },
            { key: 'outside_active_30d', label: '10+ outside businesses active in last 30 days', pass: activeOutside30d >= 10, current: activeOutside30d, target: 10 },
            { key: 'urgent_issues', label: 'No unresolved urgent platform issues', pass: urgentOpen === 0, current: urgentOpen, target: 0 },
            { key: 'testimonials', label: '5+ testimonial candidates with quote permission', pass: testimonialCandidates >= 5, current: testimonialCandidates, target: 5 },
            { key: 'feedback_quality', label: 'Average beta rating 4.0+ when enough ratings exist', pass: ratings.length < 5 ? false : (averageRating ?? 0) >= 4, current: ratings.length ? Number((averageRating ?? 0).toFixed(2)) : null, target: 4 }
        ];
        const passed = criteria.filter((item) => item.pass).length;
        return {
            release: release.data ?? { stage: 'invite_only_beta', public_signup_enabled: false },
            counts: {
                approvedTesters: activeTesters.length,
                students: activeTesters.filter((row) => row.cohort === 'student').length,
                outsideBusinesses: outsideWorkspaceIds.size,
                activeOutside7d,
                activeOutside30d,
                feedback: feedbackRows.length,
                testimonialCandidates,
                urgentOpen
            },
            averageRating: averageRating === null ? null : Number(averageRating.toFixed(2)),
            criteria,
            readiness: passed === criteria.length ? 'ready_for_founder_review' : passed >= 3 ? 'progressing' : 'not_ready',
            founderDecisionRequired: true
        };
    }
};
exports.BetaService = BetaService = __decorate([
    (0, common_1.Injectable)()
], BetaService);
//# sourceMappingURL=beta.service.js.map