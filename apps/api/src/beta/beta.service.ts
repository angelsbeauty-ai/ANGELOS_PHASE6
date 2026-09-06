import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { CreateBetaInviteDto } from './dto/create-beta-invite.dto';
import type { RedeemBetaInviteDto } from './dto/redeem-beta-invite.dto';
import type { SubmitBetaFeedbackDto } from './dto/submit-beta-feedback.dto';
import type { UpdateBetaFeedbackDto } from './dto/update-beta-feedback.dto';

type BetaTesterOverviewRow = { user_id: string; cohort: string; workspace_id: string | null; approved_at: string; revoked_at: string | null };
type UsageOverviewRow = { workspace_id: string | null; event_name: string; feature: string | null; created_at: string };
type FeedbackOverviewRow = { category: string; rating: number | null; permission_to_quote: boolean; status: string; created_at: string };
type AttentionOverviewRow = { severity: string; status: string };

@Injectable()
export class BetaService {
  private async isFounder(userId: string) {
    const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
    const service = createServiceSupabaseClient();
    if (envFounders.includes(userId)) {
      const { error } = await service.from('platform_founders').upsert({ user_id: userId, label: 'Environment Founder' }, { onConflict: 'user_id' });
      if (error) throw new InternalServerErrorException(error.message);
      return true;
    }
    const { data, error } = await service.from('platform_founders').select('user_id').eq('user_id', userId).maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return Boolean(data);
  }

  async me(user: AuthUser) {
    if (await this.isFounder(user.id)) return { approved: true, founderBypass: true, cohort: 'angels_beauty', workspaceId: null };
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('beta_testers').select('cohort,approved_at,workspace_id,revoked_at').eq('user_id', user.id).maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return { approved: Boolean(data && !data.revoked_at), founderBypass: false, cohort: data?.cohort ?? null, approvedAt: data?.approved_at ?? null, workspaceId: data?.workspace_id ?? null };
  }

  async ensureCanCreateWorkspace(user: AuthUser) {
    const service = createServiceSupabaseClient();
    const { data: release, error } = await service.from('platform_release_state').select('stage,public_signup_enabled').eq('id','main').maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (release?.public_signup_enabled || release?.stage === 'public') return;
    const access = await this.me(user);
    if (!access.approved) throw new ForbiddenException('AngelOS is currently invite-only. Redeem a founder-approved beta invite before creating a business workspace.');
  }

  async redeem(user: AuthUser, dto: RedeemBetaInviteDto) {
    const tokenHash = createHash('sha256').update(dto.token.trim()).digest('hex');
    const service = createServiceSupabaseClient();
    const { data, error } = await service.rpc('redeem_beta_invite', { p_token_hash: tokenHash, p_user_id: user.id, p_user_email: user.email ?? '' });
    if (error) {
      const message = String(error.message ?? '');
      if (message.includes('expired_beta_invite')) throw new ConflictException('Beta invite has expired.');
      if (message.includes('beta_invite_email_mismatch')) throw new ForbiddenException('This beta invite was approved for a different email address.');
      if (message.includes('invalid_beta_invite')) throw new NotFoundException('Beta invite is invalid, revoked, or already used.');
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async submitFeedback(user: AuthUser, workspaceId: string, dto: SubmitBetaFeedbackDto) {
    const client = createUserSupabaseClient(user.accessToken);
    const { data: workspace, error: workspaceError } = await client.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (workspaceError) throw new InternalServerErrorException(workspaceError.message);
    if (!workspace) throw new NotFoundException('Workspace not found.');
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('beta_feedback').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      category: dto.category,
      message: dto.message.trim(),
      rating: dto.rating ?? null,
      permission_to_contact: dto.permissionToContact ?? false,
      permission_to_quote: dto.permissionToQuote ?? false
    }).select('id,category,rating,permission_to_contact,permission_to_quote,status,created_at').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async createInvite(user: AuthUser, dto: CreateBetaInviteDto) {
    const service = createServiceSupabaseClient();
    const rawToken = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = dto.expiresInDays ? new Date(Date.now() + dto.expiresInDays * 86400000).toISOString() : null;
    const { data, error } = await service.from('beta_invites').insert({ token_hash: tokenHash, email_hint: dto.emailHint ?? null, cohort: dto.cohort ?? 'outside', label: dto.label ?? null, region: dto.region ?? null, created_by: user.id, expires_at: expiresAt }).select('id,email_hint,cohort,label,region,expires_at,redeemed_at,revoked_at,created_at').single();
    if (error) throw new InternalServerErrorException(error.message);
    return { ...data, token: rawToken };
  }

  async listInvites() {
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('beta_invites').select('id,email_hint,cohort,label,region,expires_at,redeemed_by,redeemed_at,revoked_at,created_at').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async revokeInvite(id: string) {
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('beta_invites').update({ revoked_at: new Date().toISOString() }).eq('id', id).is('redeemed_at', null).select('id,revoked_at').maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Unused beta invite not found.');
    return data;
  }

  async revokeTester(userId: string) {
    const service = createServiceSupabaseClient();
    const now = new Date();
    const { data: tester, error } = await service.from('beta_testers').update({ revoked_at: now.toISOString() }).eq('user_id', userId).is('revoked_at', null).select('user_id,workspace_id,cohort,revoked_at').maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!tester) throw new NotFoundException('Active beta tester not found.');
    if (tester.workspace_id) {
      // Only downgrade a workspace that is still on beta terms. Without the status guard this
      // force-wrote read_only over any subscription, so revoking a tester who had since started
      // paying silently downgraded a paying customer and restarted their 60-day window on every
      // repeat call. The result was also discarded, so a failed downgrade still returned 200.
      const { data: downgraded, error: downgradeError } = await service
        .from('workspace_subscriptions')
        .update({ status: 'read_only', read_only_started_at: now.toISOString(), read_only_until: new Date(now.getTime() + 60 * 86400000).toISOString(), updated_at: now.toISOString() })
        .eq('workspace_id', tester.workspace_id)
        .eq('status', 'trialing')
        .select('workspace_id,status')
        .maybeSingle();
      if (downgradeError) throw new InternalServerErrorException(downgradeError.message);
      if (downgraded) {
        // Same audit trail the subscriptions module writes for every other status change.
        const { error: eventError } = await service.from('subscription_events').insert({
          workspace_id: tester.workspace_id,
          event_type: 'beta_revoked',
          details: { toStatus: 'read_only', reason: 'Beta tester access revoked by founder.' }
        });
        if (eventError) throw new InternalServerErrorException(eventError.message);
      }
      return { ...tester, subscriptionDowngraded: Boolean(downgraded) };
    }
    return tester;
  }

  async listFeedback() {
    const service = createServiceSupabaseClient();
    const { data, error } = await service.from('beta_feedback').select('id,workspace_id,category,message,rating,permission_to_contact,permission_to_quote,status,founder_note,created_at,updated_at').order('created_at', { ascending: false }).limit(200);
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async updateFeedback(id: string, dto: UpdateBetaFeedbackDto) {
    const service = createServiceSupabaseClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.founderNote !== undefined) patch.founder_note = dto.founderNote;
    const { data, error } = await service.from('beta_feedback').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Beta feedback not found.');
    return data;
  }

  async overview() {
    const service = createServiceSupabaseClient();
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
    const [testers, usage7d, usage30d, feedback, attention, release] = await Promise.all([
      service.from('beta_testers').select('user_id,cohort,workspace_id,approved_at,revoked_at'),
      service.from('product_usage_events').select('workspace_id,event_name,feature,created_at').gte('created_at', since7d),
      service.from('product_usage_events').select('workspace_id,event_name,feature,created_at').gte('created_at', since30d),
      service.from('beta_feedback').select('category,rating,permission_to_quote,status,created_at'),
      service.from('attention_items').select('severity,status').in('status',['open','acknowledged']),
      service.from('platform_release_state').select('*').eq('id','main').maybeSingle()
    ]);
    for (const result of [testers, usage7d, usage30d, feedback, attention, release]) if (result.error) throw new InternalServerErrorException(result.error.message);
    const testerRows = (testers.data ?? []) as BetaTesterOverviewRow[];
    const usage7dRows = (usage7d.data ?? []) as UsageOverviewRow[];
    const usage30dRows = (usage30d.data ?? []) as UsageOverviewRow[];
    const feedbackRows = (feedback.data ?? []) as FeedbackOverviewRow[];
    const attentionRows = (attention.data ?? []) as AttentionOverviewRow[];
    const activeTesters = testerRows.filter((row) => !row.revoked_at);
    const outsideWorkspaceIds = new Set(activeTesters.filter((row) => row.cohort === 'outside' && row.workspace_id).map((row) => row.workspace_id as string));
    const activeOutside7d = new Set(usage7dRows.filter((row) => row.workspace_id && outsideWorkspaceIds.has(row.workspace_id)).map((row) => row.workspace_id as string)).size;
    const activeOutside30d = new Set(usage30dRows.filter((row) => row.workspace_id && outsideWorkspaceIds.has(row.workspace_id)).map((row) => row.workspace_id as string)).size;
    const ratings = feedbackRows.map((row) => Number(row.rating)).filter((value) => Number.isFinite(value));
    const averageRating = ratings.length ? ratings.reduce((a,b) => a+b,0) / ratings.length : null;
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
}
