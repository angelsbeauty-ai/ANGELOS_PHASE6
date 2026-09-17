"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_service_1 = require("../ai/ai-provider.service");
const supabase_1 = require("../config/supabase");
let AnalyticsService = exports.AnalyticsService = class AnalyticsService {
    aiProvider;
    constructor(aiProvider) {
        this.aiProvider = aiProvider;
    }
    async getMarketingProfile(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const [{ data: profile, error }, { data: workspace, error: workspaceError }] = await Promise.all([
            supabase.from('marketing_profiles').select('*').eq('workspace_id', workspaceId).maybeSingle(),
            supabase.from('workspaces').select('id,name,business_type,timezone,currency,locale').eq('id', workspaceId).single()
        ]);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
        return profile ?? {
            workspace_id: workspaceId,
            primary_goal: 'bookings',
            target_client: null,
            service_area: null,
            city: null,
            region: null,
            country: null,
            experience_level: 'beginner',
            content_preferences: {},
            local_context_enabled: true,
            workspace
        };
    }
    async updateMarketingProfile(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const payload = { workspace_id: workspaceId, updated_at: new Date().toISOString() };
        if (dto.primaryGoal !== undefined)
            payload.primary_goal = dto.primaryGoal;
        if (dto.targetClient !== undefined)
            payload.target_client = cleanNullable(dto.targetClient);
        if (dto.serviceArea !== undefined)
            payload.service_area = cleanNullable(dto.serviceArea);
        if (dto.city !== undefined)
            payload.city = cleanNullable(dto.city);
        if (dto.region !== undefined)
            payload.region = cleanNullable(dto.region);
        if (dto.country !== undefined)
            payload.country = cleanNullable(dto.country);
        if (dto.experienceLevel !== undefined)
            payload.experience_level = dto.experienceLevel;
        if (dto.contentPreferences !== undefined)
            payload.content_preferences = dto.contentPreferences;
        if (dto.localContextEnabled !== undefined)
            payload.local_context_enabled = dto.localContextEnabled;
        const { data, error } = await supabase.from('marketing_profiles').upsert(payload, { onConflict: 'workspace_id' }).select('*').single();
        if (error || !data)
            throw new common_1.InternalServerErrorException(error?.message ?? 'Could not save marketing profile');
        return data;
    }
    async recordContentMetrics(user, workspaceId, variantId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: variant, error: variantError } = await supabase
            .from('content_variants')
            .select('id,workspace_id,platform,status,published_at,content_post_id')
            .eq('workspace_id', workspaceId)
            .eq('id', variantId)
            .single();
        if (variantError || !variant)
            throw new common_1.NotFoundException('Content variant not found');
        const payload = {
            workspace_id: workspaceId,
            content_variant_id: variantId,
            source: 'manual_entry',
            reach: nullish(dto.reach),
            impressions: nullish(dto.impressions),
            views: nullish(dto.views),
            watch_time_seconds: nullish(dto.watchTimeSeconds),
            average_watch_time_seconds: nullish(dto.averageWatchTimeSeconds),
            likes: nullish(dto.likes),
            comments: nullish(dto.comments),
            saves: nullish(dto.saves),
            shares: nullish(dto.shares),
            profile_visits: nullish(dto.profileVisits),
            link_clicks: nullish(dto.linkClicks),
            dms: nullish(dto.dms),
            inquiries: nullish(dto.inquiries),
            bookings: nullish(dto.bookings),
            revenue: nullish(dto.revenue),
            currency: dto.currency ?? null,
            completion_rate: nullish(dto.completionRate),
            raw_metrics: dto.rawMetrics ?? {},
            created_by: user.id
        };
        const { data, error } = await supabase.from('content_metric_snapshots').insert(payload).select('*').single();
        if (error || !data)
            throw new common_1.InternalServerErrorException(error?.message ?? 'Could not record content metrics');
        return data;
    }
    async recordAudienceActivity(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('id').eq('id', workspaceId).single();
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
        const { data, error } = await supabase.from('audience_activity_snapshots').insert({
            workspace_id: workspaceId,
            platform: dto.platform,
            day_of_week: dto.dayOfWeek,
            hour_local: dto.hourLocal,
            active_followers: dto.activeFollowers,
            source: 'manual_entry',
            raw_metrics: dto.rawMetrics ?? {},
            created_by: user.id
        }).select('*').single();
        if (error || !data)
            throw new common_1.InternalServerErrorException(error?.message ?? 'Could not record audience activity');
        return data;
    }
    async overview(user, workspaceId, days = 30) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const owner = await supabase.from('workspace_memberships').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).eq('role', 'owner').maybeSingle();
        if (owner.error || !owner.data)
            throw new common_1.ForbiddenException('Only the workspace owner can view business analytics');
        const safeDays = Math.max(7, Math.min(365, Math.trunc(Number.isFinite(days) ? days : 30)));
        const periodEnd = new Date();
        const periodStart = new Date(periodEnd.getTime() - safeDays * 24 * 60 * 60 * 1000);
        const [{ data: workspace, error: workspaceError }, { data: variants, error: variantsError }, { data: metrics, error: metricsError }, { data: audience, error: audienceError }, { data: profile, error: profileError }] = await Promise.all([
            supabase.from('workspaces').select('id,name,business_type,timezone,currency,locale').eq('id', workspaceId).single(),
            supabase.from('content_variants').select('id,platform,format,status,published_at,scheduled_for,content_post_id,post:content_posts(id,title,objective,primary_format,strategy_reason)').eq('workspace_id', workspaceId).gte('published_at', periodStart.toISOString()).order('published_at', { ascending: false }),
            supabase.from('content_metric_snapshots').select('*').eq('workspace_id', workspaceId).gte('captured_at', periodStart.toISOString()).order('captured_at', { ascending: false }),
            supabase.from('audience_activity_snapshots').select('*').eq('workspace_id', workspaceId).gte('captured_at', periodStart.toISOString()).order('captured_at', { ascending: false }).limit(1000),
            supabase.from('marketing_profiles').select('*').eq('workspace_id', workspaceId).maybeSingle()
        ]);
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
        if (variantsError)
            throw new common_1.InternalServerErrorException(variantsError.message);
        if (metricsError)
            throw new common_1.InternalServerErrorException(metricsError.message);
        if (audienceError)
            throw new common_1.InternalServerErrorException(audienceError.message);
        if (profileError)
            throw new common_1.InternalServerErrorException(profileError.message);
        const latestByVariant = latestMetricsByVariant(metrics ?? []);
        const rows = (variants ?? []).map((variant) => ({ ...variant, metrics: latestByVariant.get(variant.id) ?? null }));
        const measuredRows = rows.filter((row) => row.metrics);
        const totals = sumMetrics(measuredRows.map((row) => row.metrics));
        const scored = measuredRows
            .map((row) => ({ ...row, businessScore: contentBusinessScore(row.metrics) }))
            .sort((a, b) => b.businessScore - a.businessScore);
        const topPost = scored[0] ? summarizePost(scored[0]) : null;
        const strongestByGoal = buildGoalLeaders(scored);
        const postingWindow = computeBestPostingWindow(rows, audience ?? [], workspace.timezone);
        const patterns = buildContentPatterns(scored);
        const evidence = {
            publishedVariants: rows.length,
            measuredVariants: measuredRows.length,
            audienceActivitySamples: (audience ?? []).length,
            ownedDataConfidence: confidenceFromCounts(measuredRows.length, (audience ?? []).length),
            localContext: {
                enabled: profile?.local_context_enabled ?? true,
                serviceArea: profile?.service_area ?? null,
                city: profile?.city ?? null,
                region: profile?.region ?? null,
                country: profile?.country ?? null,
                liveLocalResearchConnected: false
            }
        };
        return {
            period: { days: safeDays, start: periodStart.toISOString(), end: periodEnd.toISOString() },
            workspace: { id: workspace.id, name: workspace.name, timezone: workspace.timezone, currency: workspace.currency },
            profile: profile ?? { primary_goal: 'bookings', experience_level: 'beginner', local_context_enabled: true },
            operatingCosts: await this.operatingCosts(supabase, workspaceId),
            totals,
            topPost,
            strongestByGoal,
            postingWindow,
            patterns,
            evidence,
            recentPosts: scored.slice(0, 12).map(summarizePost)
        };
    }
    async operatingCosts(supabase, workspaceId) {
        const subscription = await supabase.from('workspace_subscriptions').select('plan_code,billing_interval,discount_percent,status').eq('workspace_id', workspaceId).maybeSingle();
        if (subscription.error)
            throw new common_1.InternalServerErrorException(subscription.error.message);
        let planPrice = null;
        if (subscription.data) {
            const plan = await supabase.from('subscription_plans').select('monthly_price_cents,yearly_price_cents,currency').eq('code', subscription.data.plan_code).maybeSingle();
            if (plan.error)
                throw new common_1.InternalServerErrorException(plan.error.message);
            if (plan.data) {
                const interval = subscription.data.billing_interval;
                const cents = interval === 'yearly' ? plan.data.yearly_price_cents : plan.data.monthly_price_cents;
                planPrice = { amountCents: Math.round(Number(cents) * (100 - Number(subscription.data.discount_percent)) / 100), currency: plan.data.currency, interval, status: subscription.data.status };
            }
        }
        return { planPrice, actualTotal: null, ai: null, messaging: null, hosting: null, explanation: 'Plan price is a quote, not a charge. Actual provider costs are not measured yet.' };
    }
    async marketingCoach(user, workspaceId, days = 30) {
        const overview = await this.overview(user, workspaceId, days);
        const confidence = overview.evidence.ownedDataConfidence;
        const deterministic = deterministicRecommendation(overview);
        let recommendation = deterministic;
        let provider = 'deterministic';
        let model = 'angelos-analytics-rules-v1';
        if ((process.env.AI_PROVIDER_MODE ?? 'mock') === 'openai' || (process.env.AI_PROVIDER_MODE ?? 'mock') === 'mock') {
            try {
                const ai = await this.aiProvider.generate({
                    instructions: [
                        'You are AngelOS Marketing Coach for a beauty/service business.',
                        'Use only the evidence supplied. Never invent metrics, attribution, audience behavior, local events, or platform facts.',
                        'Give one strongest next marketing action, explain why in plain language, and end with one focused next-step question or offer to act.',
                        'If data is sparse, say so clearly and frame the advice as a test rather than a fact.',
                        'Optimize for the workspace primary goal, especially inquiries/bookings over vanity metrics when that is the goal.',
                        'Do not promise virality. Keep the answer concise and practical.'
                    ].join(' '),
                    input: `MARKETING_COACH\nEvidence JSON:\n${JSON.stringify(overview)}`
                });
                recommendation = ai.text;
                provider = ai.provider;
                model = ai.model;
            }
            catch {
            }
        }
        const service = (0, supabase_1.createServiceSupabaseClient)();
        await service.from('marketing_coach_runs').insert({
            workspace_id: workspaceId,
            period_start: overview.period.start,
            period_end: overview.period.end,
            confidence,
            evidence: overview,
            recommendation,
            provider,
            model,
            created_by: user.id
        });
        return { recommendation, confidence, provider, model, evidence: overview };
    }
};
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_provider_service_1.AiProviderService])
], AnalyticsService);
function cleanNullable(value) {
    const cleaned = value.trim();
    return cleaned.length ? cleaned : null;
}
function nullish(value) {
    return value === undefined ? null : value;
}
function latestMetricsByVariant(metrics) {
    const map = new Map();
    for (const metric of metrics) {
        if (!map.has(metric.content_variant_id))
            map.set(metric.content_variant_id, metric);
    }
    return map;
}
const numericMetricKeys = ['reach', 'impressions', 'views', 'watch_time_seconds', 'likes', 'comments', 'saves', 'shares', 'profile_visits', 'link_clicks', 'dms', 'inquiries', 'bookings', 'revenue'];
function sumMetrics(metrics) {
    const result = {};
    for (const key of numericMetricKeys) {
        const values = metrics.map((metric) => metric[key]).filter((value) => value !== null && value !== undefined).map(Number);
        result[key] = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
    }
    const completion = metrics.map((metric) => metric.completion_rate).filter((value) => value !== null && value !== undefined).map(Number);
    result.average_completion_rate = completion.length ? completion.reduce((sum, value) => sum + value, 0) / completion.length : null;
    return result;
}
function contentBusinessScore(metric) {
    return n(metric.bookings) * 100 + n(metric.inquiries) * 25 + n(metric.dms) * 8 + n(metric.profile_visits) + n(metric.shares) * 3 + n(metric.saves) * 2 + n(metric.comments) * 0.5 + n(metric.views) * 0.0005 + n(metric.reach) * 0.0002;
}
function n(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}
function summarizePost(row) {
    return {
        variantId: row.id,
        contentPostId: row.content_post_id,
        title: row.post?.title ?? 'Untitled content',
        objective: row.post?.objective ?? null,
        platform: row.platform,
        format: row.format,
        publishedAt: row.published_at,
        businessScore: Number(row.businessScore ?? contentBusinessScore(row.metrics ?? {})).toFixed(2),
        metrics: row.metrics ? pickPublicMetrics(row.metrics) : null
    };
}
function pickPublicMetrics(metric) {
    const output = {};
    for (const key of [...numericMetricKeys, 'average_watch_time_seconds', 'completion_rate']) {
        output[key] = metric[key] === undefined ? null : metric[key];
    }
    output.currency = metric.currency ?? null;
    output.source = metric.source ?? null;
    return output;
}
function buildGoalLeaders(scored) {
    const goals = {
        reach: (row) => n(row.metrics?.reach) || n(row.metrics?.views),
        saves: (row) => n(row.metrics?.saves),
        profileVisits: (row) => n(row.metrics?.profile_visits),
        inquiries: (row) => n(row.metrics?.inquiries) || n(row.metrics?.dms),
        bookings: (row) => n(row.metrics?.bookings)
    };
    const result = {};
    for (const [goal, getter] of Object.entries(goals)) {
        const winner = [...scored].sort((a, b) => getter(b) - getter(a))[0];
        result[goal] = winner && getter(winner) > 0 ? summarizePost(winner) : null;
    }
    return result;
}
function buildContentPatterns(scored) {
    const byFormat = aggregatePattern(scored, (row) => row.format);
    const byPlatform = aggregatePattern(scored, (row) => row.platform);
    const byObjective = aggregatePattern(scored, (row) => row.post?.objective ?? 'unknown');
    return { byFormat, byPlatform, byObjective };
}
function aggregatePattern(rows, keyFn) {
    const groups = new Map();
    for (const row of rows) {
        const key = keyFn(row);
        const current = groups.get(key) ?? { count: 0, score: 0, bookings: 0, inquiries: 0, saves: 0, profileVisits: 0 };
        current.count += 1;
        current.score += n(row.businessScore);
        current.bookings += n(row.metrics?.bookings);
        current.inquiries += n(row.metrics?.inquiries);
        current.saves += n(row.metrics?.saves);
        current.profileVisits += n(row.metrics?.profile_visits);
        groups.set(key, current);
    }
    return [...groups.entries()].map(([key, value]) => ({ key, ...value, averageBusinessScore: value.count ? value.score / value.count : 0 })).sort((a, b) => b.averageBusinessScore - a.averageBusinessScore);
}
function computeBestPostingWindow(rows, audience, timezone) {
    if (audience.length) {
        const grouped = new Map();
        for (const sample of audience) {
            const key = `${sample.platform}:${sample.day_of_week}:${sample.hour_local}`;
            const current = grouped.get(key) ?? { total: 0, count: 0, platform: sample.platform, day: sample.day_of_week, hour: sample.hour_local };
            current.total += n(sample.active_followers);
            current.count += 1;
            grouped.set(key, current);
        }
        const best = [...grouped.values()].map((item) => ({ ...item, averageActiveFollowers: item.total / item.count })).sort((a, b) => b.averageActiveFollowers - a.averageActiveFollowers)[0];
        if (best)
            return { source: 'audience_activity', confidence: audience.length >= 24 ? 'high' : audience.length >= 8 ? 'medium' : 'low', platform: best.platform, dayOfWeek: best.day, hourLocal: best.hour, label: `${weekdayName(best.day)} around ${formatHour(best.hour)}` };
    }
    const measured = rows.filter((row) => row.metrics && row.published_at);
    if (measured.length >= 2) {
        const grouped = new Map();
        for (const row of measured) {
            const parts = localDateParts(row.published_at, timezone);
            const key = `${parts.dayOfWeek}:${parts.hour}`;
            const current = grouped.get(key) ?? { score: 0, count: 0, day: parts.dayOfWeek, hour: parts.hour };
            current.score += contentBusinessScore(row.metrics);
            current.count += 1;
            grouped.set(key, current);
        }
        const best = [...grouped.values()].map((item) => ({ ...item, averageScore: item.score / item.count })).sort((a, b) => b.averageScore - a.averageScore)[0];
        if (best)
            return { source: 'owned_post_performance', confidence: measured.length >= 8 ? 'high' : measured.length >= 4 ? 'medium' : 'low', platform: null, dayOfWeek: best.day, hourLocal: best.hour, label: `${weekdayName(best.day)} around ${formatHour(best.hour)}` };
    }
    return { source: 'insufficient_data', confidence: 'low', platform: null, dayOfWeek: null, hourLocal: null, label: null, message: 'Not enough owned audience/performance data yet. AngelOS should test and learn rather than pretend there is a proven best time.' };
}
function localDateParts(iso, timeZone) {
    const date = new Date(iso);
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
    const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' });
    const weekday = weekdayFormatter.format(date);
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dayOfWeek: dayMap[weekday] ?? 0, hour: Number(hourFormatter.format(date)) };
}
function weekdayName(day) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? 'Unknown day';
}
function formatHour(hour) {
    const normalized = ((hour % 24) + 24) % 24;
    const display = normalized % 12 || 12;
    return `${display}:00 ${normalized < 12 ? 'AM' : 'PM'}`;
}
function confidenceFromCounts(measuredPosts, audienceSamples) {
    if (measuredPosts >= 8 || audienceSamples >= 24)
        return 'high';
    if (measuredPosts >= 3 || audienceSamples >= 8)
        return 'medium';
    return 'low';
}
function deterministicRecommendation(overview) {
    const goal = overview.profile?.primary_goal ?? 'bookings';
    if (!overview.evidence.measuredVariants) {
        return `I don't have enough of your own performance data yet to claim what works best. Your current goal is ${goal.replace(/_/g, ' ')}. Let's treat the next few posts as tests and measure the results. What unused client results or short clips do you have available right now?`;
    }
    const top = overview.topPost;
    const time = overview.postingWindow?.label;
    const timing = time ? ` Your strongest current posting window is ${time}, but confidence is ${overview.postingWindow.confidence}.` : '';
    return `Your strongest measured content right now is “${top?.title ?? 'your top post'}” on ${top?.platform ?? 'social media'}. For your ${goal.replace(/_/g, ' ')} goal, I recommend creating one new post that repeats the strongest useful pattern without copying it exactly.${timing} Do you want me to use your unused media to build that next post?`;
}
//# sourceMappingURL=analytics.service.js.map