export declare class HealthService {
    liveness(): {
        status: string;
        service: string;
        environment: string;
        release: string;
        deploymentId: string | null;
        timestamp: string;
    };
    readiness(): Promise<{
        status: string;
        service: string;
        checks: {
            database: string;
        };
        latencyMs: number;
        timestamp: string;
    }>;
}
