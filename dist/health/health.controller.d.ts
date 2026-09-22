import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): {
        status: string;
        service: string;
        environment: string;
        release: string;
        deploymentId: string | null;
        timestamp: string;
    };
    getReadiness(): Promise<{
        status: string;
        service: string;
        checks: {
            database: string;
        };
        latencyMs: number;
        timestamp: string;
    }>;
}
