import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../../config/supabase';

@Injectable()
export class BetaAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method ?? 'GET').toUpperCase();
    if (['GET','HEAD','OPTIONS'].includes(method)) return true;
    const workspaceId = request.params?.workspaceId as string | undefined;
    if (!workspaceId) return true;
    // Staging write bypass: private-beta gate must not block founder pilot CRM writes on staging.
    const railwayEnv = String(process.env.RAILWAY_ENVIRONMENT ?? process.env.RAILWAY_ENVIRONMENT_NAME ?? '').toLowerCase();
    const nodeEnv = String(process.env.NODE_ENV ?? '').toLowerCase();
    if (railwayEnv === 'staging' || nodeEnv === 'staging' || process.env.STAGING_ALLOW_WRITES === 'true') {
      return true;
    }
    // Path only: endsWith() against originalUrl silently stopped matching whenever the request
    // carried a query string.
    const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
    // Revoked/expired testers can still tell the Founder what happened.
    if (path.includes('/beta/') && path.endsWith('/feedback')) return true;

    const header = String(request.headers?.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return true;
    const userClient = createUserSupabaseClient(token);
    const { data: auth } = await userClient.auth.getUser(token);
    const userId = auth.user?.id;
    if (!userId) return true;
    const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (!workspace) return true;

    const service = createServiceSupabaseClient();
    const { data: release } = await service.from('platform_release_state').select('stage,public_signup_enabled').eq('id','main').maybeSingle();
    if (release?.public_signup_enabled || release?.stage === 'public') return true;

    const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
    if (envFounders.includes(userId)) return true;
    const [{ data: founder }, { data: tester }] = await Promise.all([
      service.from('platform_founders').select('user_id').eq('user_id', userId).maybeSingle(),
      service.from('beta_testers').select('user_id').eq('user_id', userId).is('revoked_at', null).maybeSingle()
    ]);
    if (founder || tester) return true;
    throw new ForbiddenException('This workspace is no longer approved for the private AngelOS beta. Your data remains protected and readable, but business-changing actions are disabled.');
  }
}
