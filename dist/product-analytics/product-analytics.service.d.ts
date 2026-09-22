import type { AuthUser } from '../auth/auth-user';
import type { TrackProductEventDto } from './dto/track-product-event.dto';
export declare class ProductAnalyticsService {
    track(user: AuthUser, workspaceId: string, dto: TrackProductEventDto): Promise<{
        recorded: boolean;
    }>;
}
