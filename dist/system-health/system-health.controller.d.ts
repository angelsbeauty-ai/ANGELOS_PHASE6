import type { AuthUser } from '../auth/auth-user';
import { UpdateOperationalControlsDto } from './dto/update-operational-controls.dto';
import { SystemHealthService } from './system-health.service';
export declare class SystemHealthController {
    private readonly health;
    constructor(health: SystemHealthService);
    overview(user: AuthUser, workspaceId: string): Promise<{
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
    run(user: AuthUser, workspaceId: string): Promise<{
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
    attention(user: AuthUser, workspaceId: string): Promise<any[]>;
    acknowledge(user: AuthUser, workspaceId: string, attentionId: string): Promise<any>;
    controls(user: AuthUser, workspaceId: string, dto: UpdateOperationalControlsDto): Promise<any>;
}
