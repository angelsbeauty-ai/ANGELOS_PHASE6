export interface RunMigrationResult {
    success: boolean;
    message: string;
    rows?: unknown[];
}
export declare class DbMigrationService {
    private pgHost;
    private pgPort;
    private pgUser;
    private pgPassword;
    private pgDatabase;
    private serviceRoleKey;
    constructor();
    testConnection(): Promise<{
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
    }>;
    runMigration(sql: string, idempotencyKey: string): Promise<RunMigrationResult>;
}
export declare class DbMigrationController {
    private readonly dbMigrationService;
    constructor(dbMigrationService: DbMigrationService);
    testConnection(token: string): Promise<{
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
    }>;
    runMigrations(body: {
        sql?: string;
    }, token: string): Promise<RunMigrationResult>;
}
export declare class DbMigrationModule {
}
