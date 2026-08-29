import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../../config/supabase';

@Injectable()
export class PlatformFeatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method ?? 'GET').toUpperCase();
    if (['GET','HEAD','OPTIONS'].includes(method)) return true;
    const workspaceId = request.params?.workspaceId as string | undefined;
    if (!workspaceId) return true;
    const path = String(request.originalUrl ?? request.url ?? '');
    const featureKey = this.featureFor(path, method);
    if (!featureKey) return true;

    const header = String(request.headers?.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return true;
    const userClient = createUserSupabaseClient(token);
    const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (!workspace) return true;

    const service = createServiceSupabaseClient();
    const [{ data: globalFlag }, { data: override }] = await Promise.all([
      service.from('platform_feature_flags').select('enabled,stage,name').eq('key', featureKey).maybeSingle(),
      service.from('workspace_feature_overrides').select('enabled').eq('workspace_id', workspaceId).eq('feature_key', featureKey).maybeSingle()
    ]);
    const enabled = override?.enabled ?? (globalFlag?.enabled && !['paused','off'].includes(globalFlag.stage));
    if (!enabled) throw new ServiceUnavailableException(`${globalFlag?.name ?? featureKey} is temporarily unavailable. Other AngelOS features remain available.`);
    return true;
  }

  private featureFor(path: string, method: string) {
    if (path.includes('/messaging/messages/') && path.endsWith('/approve-send')) return 'messaging_send';
    if (path.includes('/content/variants/') && path.endsWith('/publish')) return 'content_publishing';
    if (path.includes('/automations/process-due')) return 'automations_execution';
    if (path.includes('/analytics/marketing-coach')) return 'analytics_coach';
    if (path.includes('/ai/') && ['POST','PATCH','PUT'].includes(method)) return 'ai_core';
    return null;
  }
}
