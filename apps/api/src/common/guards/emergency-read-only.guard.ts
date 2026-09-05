import { CanActivate, ConflictException, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createUserSupabaseClient } from '../../config/supabase';

@Injectable()
export class EmergencyReadOnlyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method ?? 'GET').toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    const workspaceId = request.params?.workspaceId as string | undefined;
    if (!workspaceId) return true;

    const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
    // Diagnostics and owner recovery controls must remain available during an emergency pause.
    if (/\/workspaces\/[^/]+\/(system-health|subscription|product-analytics|beta)(\/|$)/.test(path)) return true;
    // AI chat/analyze remains available. The AI service separately blocks action approval/mutations.
    if (/\/workspaces\/[^/]+\/ai\/conversations(\/|$)/.test(path)) return true;
    if (/\/workspaces\/[^/]+\/ai\/actions\/[^/]+\/cancel\/?$/.test(path)) return true;

    const header = String(request.headers?.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return true; // The normal auth guard will reject unauthenticated protected routes.

    const userClient = createUserSupabaseClient(token);
    const { data: workspace, error: workspaceError } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (workspaceError) throw new ServiceUnavailableException('Workspace safety check unavailable');
    if (!workspace) return true; // Do not leak workspace state; normal authorization handles access.

    const { data: controls, error: controlsError } = await userClient.from('workspace_operational_controls').select('emergency_read_only').eq('workspace_id', workspaceId).maybeSingle();
    if (controlsError || !controls) throw new ServiceUnavailableException('Operational safety controls unavailable');
    if (controls.emergency_read_only) {
      throw new ConflictException('AngelOS is in emergency read-only mode. Business-changing actions are paused until the owner resumes them.');
    }
    return true;
  }
}
