import type { AuthUser } from '../auth/auth-user';
import { TrackProductEventDto } from './dto/track-product-event.dto';
import { ProductAnalyticsService } from './product-analytics.service';
export declare class ProductAnalyticsController {
    private readonly analytics;
    constructor(analytics: ProductAnalyticsService);
    track(user: AuthUser, workspaceId: string, dto: TrackProductEventDto): Promise<{
        recorded: boolean;
    }>;
}
