import { PublishingAdapterRegistry } from './publishing-adapter.registry';
import type { AuthUser } from '../auth/auth-user';
export declare class PublishingService {
    private readonly registry;
    constructor(registry: PublishingAdapterRegistry);
    publishNow(user: AuthUser, workspaceId: string, variantId: string, platform?: string): Promise<{
        variant: any;
        published: boolean;
        duplicatePrevented: boolean;
        verification?: Record<string, any>;
    }>;
    getDetail(supabase: any, workspaceId: string, contentPostId: string): Promise<any>;
}
