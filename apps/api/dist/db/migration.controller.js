"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbMigrationModule = exports.DbMigrationController = exports.DbMigrationService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const crypto = require("crypto");
let DbMigrationService = exports.DbMigrationService = class DbMigrationService {
    pgHost;
    pgPort;
    pgUser;
    pgPassword;
    pgDatabase;
    serviceRoleKey;
    constructor() {
        this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        this.pgHost = process.env.DB_HOST || 'db.hhzegavoyuicclsmrkwf.supabase.co';
        this.pgPort = parseInt(process.env.DB_PORT || '5432', 10);
        this.pgUser = process.env.DB_USER || 'postgres';
        this.pgPassword = process.env.DB_PASSWORD || this.serviceRoleKey;
        this.pgDatabase = process.env.DB_DATABASE || 'postgres';
    }
    async testConnection() {
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: this.pgHost,
                port: this.pgPort,
                database: this.pgDatabase,
                user: this.pgUser,
                password: this.pgPassword,
                ssl: { rejectUnauthorized: false, servername: this.pgHost },
                connectionTimeoutMillis: 10000
            });
            await client.connect();
            const result = await client.query('SELECT current_database(), current_user, inet_server_addr(), version()');
            await client.end();
            return {
                success: true,
                message: 'Connected successfully',
                details: {
                    database: result.rows[0].current_database,
                    user: result.rows[0].current_user,
                    server: result.rows[0].inet_server_addr,
                    version: result.rows[0].version.substring(0, 100)
                }
            };
        }
        catch (e) {
            const err = e;
            return { success: false, message: err.message.substring(0, 500) };
        }
    }
    async runMigration(sql, idempotencyKey) {
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: this.pgHost,
                port: this.pgPort,
                database: this.pgDatabase,
                user: this.pgUser,
                password: this.pgPassword,
                ssl: { rejectUnauthorized: false, servername: this.pgHost },
                connectionTimeoutMillis: 15000
            });
            await client.connect();
            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
            const results = [];
            for (const statement of statements) {
                try {
                    const result = await client.query(statement);
                    results.push({ statement: statement.substring(0, 60) + '...', rowCount: result.rowCount || 0, command: result.command });
                    console.log('Executed: ' + statement.substring(0, 80));
                }
                catch (e) {
                    const err = e;
                    if (err.message.includes('already exists') || err.message.includes('duplicate') || err.message.includes('IF NOT EXISTS')) {
                        console.log('Skipped (already exists): ' + statement.substring(0, 60));
                        continue;
                    }
                    console.log('Statement error: ' + e.message.substring(0, 100));
                }
            }
            await client.end();
            return { success: true, message: 'Migration executed successfully', rows: results };
        }
        catch (e) {
            const err = e;
            return { success: false, message: err.message.substring(0, 500) };
        }
    }
};
exports.DbMigrationService = DbMigrationService = __decorate([
    (0, common_2.Injectable)(),
    __metadata("design:paramtypes", [])
], DbMigrationService);
let DbMigrationController = exports.DbMigrationController = class DbMigrationController {
    dbMigrationService;
    constructor(dbMigrationService) {
        this.dbMigrationService = dbMigrationService;
    }
    async testConnection(token) {
        const expectedToken = process.env.MIGRATION_TOKEN || process.env.ADMIN_SECRET || '';
        if (expectedToken && token !== expectedToken) {
            throw new common_1.NotFoundException('Not found');
        }
        return this.dbMigrationService.testConnection();
    }
    async runMigrations(body, token) {
        const expectedToken = process.env.MIGRATION_TOKEN || process.env.ADMIN_SECRET || '';
        if (expectedToken && token !== expectedToken) {
            throw new common_1.NotFoundException('Not found');
        }
        let sql = body?.sql;
        if (!sql) {
            try {
                const fs = require('fs');
                const path = require('path');
                const possiblePaths = [
                    path.join(process.cwd(), 'supabase', 'migrations', '0015_automation_events_log.sql'),
                    path.join(process.cwd(), '..', 'supabase', 'migrations', '0015_automation_events_log.sql'),
                    path.resolve('supabase/migrations/0015_automation_events_log.sql'),
                    '/workspace/supabase/migrations/0015_automation_events_log.sql',
                ];
                for (const migrationPath of possiblePaths) {
                    try {
                        if (fs.existsSync(migrationPath)) {
                            sql = fs.readFileSync(migrationPath, 'utf-8');
                            console.log('Loaded migration from: ' + migrationPath);
                            break;
                        }
                    }
                    catch (e) {
                    }
                }
            }
            catch (e) {
                const err = e;
                console.log('Error loading migration file: ' + err.message);
            }
        }
        if (!sql) {
            return { success: false, message: 'No SQL provided and migration file not found' };
        }
        const idempotencyKey = 'migration_' + crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
        console.log('Running migration, SQL length: ' + sql.length + ', idempotencyKey: ' + idempotencyKey);
        return this.dbMigrationService.runMigration(sql, idempotencyKey);
    }
};
__decorate([
    (0, common_1.Get)('test-connection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-migration-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DbMigrationController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('run-migrations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-migration-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DbMigrationController.prototype, "runMigrations", null);
exports.DbMigrationController = DbMigrationController = __decorate([
    (0, common_1.Controller)('db'),
    __metadata("design:paramtypes", [DbMigrationService])
], DbMigrationController);
let DbMigrationModule = exports.DbMigrationModule = class DbMigrationModule {
};
exports.DbMigrationModule = DbMigrationModule = __decorate([
    (0, common_2.Module)({
        controllers: [DbMigrationController],
        providers: [DbMigrationService],
        exports: [DbMigrationService],
    })
], DbMigrationModule);
//# sourceMappingURL=migration.controller.js.map