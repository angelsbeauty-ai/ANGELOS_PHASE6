import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient } from '../config/supabase';

@Injectable()
export class FounderGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException('Founder access requires authentication.');
    const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (envFounders.includes(user.id)) return true;
    const service = createServiceSupabaseClient();
    const { data } = await service.from('platform_founders').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!data) throw new ForbiddenException('Founder access required.');
    return true;
  }
}
