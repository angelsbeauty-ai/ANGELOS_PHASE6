import type { AuthUser } from '../auth/auth-user';
import type { UpdateOperationalControlsDto } from './dto/update-operational-controls.dto';
export declare class SystemHealthService {
    getOverview(user: AuthUser, workspaceId: string): Promise<{
        overallStatus: string;
        counts: {
            urgent: number;
            today: number;
            later: number;
        };
        controls: any;
        components: any[];
        attention: any[];
    }>;
    runHealthCheck(user: AuthUser, workspaceId: string): Promise<{
        overallStatus: string;
        counts: {
            urgent: number;
            today: number;
            later: number;
        };
        controls: any;
        components: any[];
        attention: any[];
    }>;
    listAttention(user: AuthUser, workspaceId: string): Promise<any[]>;
    acknowledgeAttention(user: AuthUser, workspaceId: string, attentionId: string): Promise<any>;
    updateControls(user: AuthUser, workspaceId: string, dto: UpdateOperationalControlsDto): Promise<any>;
    private persistFindings;
    private upsertAttention;
    private resolveClearedAttention;
    private cleanupStaleComponents;
    private sortAttention;
    private mapConnectionStatus;
    private overallStatus;
    private assertWorkspaceAccess;
}
