import { CanActivate, ConflictException, ExecutionContext, Injectable } from '@nestjs/common';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../../config/supabase';

@Injectable()
export class SubscriptionAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method ?? 'GET').toUpperCase();
    if (['GET','HEAD','OPTIONS'].includes(method)) return true;
    const workspaceId = request.params?.workspaceId as string | undefined;
    if (!workspaceId) return true;
    const path = String(request.originalUrl ?? request.url ?? '');
    if (path.includes('/subscription') || path.includes('/system-health') || path.includes('/product-analytics') || path.includes('/beta/')) return true;

    const header = String(request.headers?.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return true;
    const userClient = createUserSupabaseClient(token);
    const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (!workspace) return true;

    const service = createServiceSupabaseClient();
    const { data: subscription } = await service.from('workspace_subscriptions').select('status,trial_ends_at,read_only_until').eq('workspace_id', workspaceId).maybeSingle();
    if (!subscription) return true;
    const now = new Date();
    let status = subscription.status as string;
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
      throw new ConflictException(status === 'read_only'
        ? 'AngelOS is in read-only mode for this workspace. Reactivate the subscription to make changes.'
        : 'AngelOS subscription access has expired. Reactivate to resume business actions.');
    }
    return true;
  }
}
