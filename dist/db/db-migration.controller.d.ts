export interface MigrationResult {
    success: boolean;
    message: string;
    executedMigrations?: string[];
    rows?: unknown[];
    error?: string;
}
export declare class DbMigrationService {
    private readonly logger;
    readonly dbHost = "aws-0-ap-southeast-1.pooler.supabase.com";
    readonly dbPort = 6543;
    readonly poolerSni = "hhzegavoyuicclsmrkwf.supabase.co";
    runMigrationFile(filePath: string): Promise<MigrationResult>;
    runMigrationFileGlob(filePath: string): Promise<MigrationResult>;
    executeMigration(sql: string, sourceName?: string): Promise<MigrationResult>;
}
export declare class DbMigrationController {
    private readonly service;
    private readonly logger;
    constructor(service: DbMigrationService);
    testConnection(token: string): Promise<{
        success: boolean;
        message: string;
        host?: string;
        port?: number;
    }>;
    runMigrations(body: {
        sql?: string;
        migrationId?: string;
        files?: string[];
    }, token: string): Promise<MigrationResult>;
    runSingleMigration(body: {
        migrationId: string;
    }, token: string): Promise<MigrationResult>;
}
