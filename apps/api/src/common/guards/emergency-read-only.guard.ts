import { CanActivate, ConflictException, ExecutionContext, Injectable } from '@nestjs/common';
import { createUserSupabaseClient } from '../../config/supabase';

@Injectable()
export class EmergencyReadOnlyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method ?? 'GET').toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    const workspaceId = request.params?.workspaceId as string | undefined;
    if (!workspaceId) return true;

    // Match on the path only. originalUrl carries the query string, so matching against it let a
    // caller opt out of the pause with any request whose query contained one of these strings.
    const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
    // Diagnostics and owner recovery controls must remain available during an emergency pause.
    if (path.includes('/system-health') || path.includes('/subscription') || path.includes('/product-analytics') || path.includes('/beta/')) return true;
    // AI chat/analyze remains available. The AI service separately blocks action approval/mutations.
    if (path.includes('/ai/conversations')) return true;
    if (path.includes('/ai/actions/') && path.endsWith('/cancel')) return true;

    const header = String(request.headers?.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return true; // The normal auth guard will reject unauthenticated protected routes.

    const userClient = createUserSupabaseClient(token);
    const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (!workspace) return true; // Do not leak workspace state; normal authorization handles access.

    const { data: controls } = await userClient.from('workspace_operational_controls').select('emergency_read_only').eq('workspace_id', workspaceId).maybeSingle();
    if (controls?.emergency_read_only) {
      throw new ConflictException('AngelOS is in emergency read-only mode. Business-changing actions are paused until the owner resumes them.');
    }
    return true;
  }
}
