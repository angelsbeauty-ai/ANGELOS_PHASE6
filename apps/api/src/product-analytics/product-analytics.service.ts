import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { TrackProductEventDto } from './dto/track-product-event.dto';
@Injectable()
export class ProductAnalyticsService {
  async track(user: AuthUser, workspaceId: string, dto: TrackProductEventDto) {
    const userClient = createUserSupabaseClient(user.accessToken);
    const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (!workspace) throw new NotFoundException('Workspace not found');
    const service = createServiceSupabaseClient();
    const safeScreen = dto.screen ? dto.screen.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id') : null;
    const { error } = await service.from('product_usage_events').insert({ workspace_id: workspaceId, user_id: user.id, event_name: dto.eventName, screen: safeScreen, feature: dto.feature ?? null, action_key: dto.actionKey ?? null, outcome: dto.outcome ?? null, duration_ms: dto.durationMs ?? null });
    if (error) throw new InternalServerErrorException(error.message);
    return { recorded: true };
  }
}
