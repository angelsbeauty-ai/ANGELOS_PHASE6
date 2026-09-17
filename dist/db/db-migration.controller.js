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
var DbMigrationService_1, DbMigrationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbMigrationController = exports.DbMigrationService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let DbMigrationService = DbMigrationService_1 = class DbMigrationService {
    logger = new common_1.Logger(DbMigrationService_1.name);
    dbHost = 'aws-0-ap-southeast-1.pooler.supabase.com';
    dbPort = 6543;
    poolerSni = 'hhzegavoyuicclsmrkwf.supabase.co';
    async runMigrationFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return { success: false, message: `Migration file not found: ${filePath}` };
        }
        const sql = fs.readFileSync(filePath, 'utf-8');
        return this.executeMigration(sql, filePath);
    }
    async runMigrationFileGlob(filePath) {
        const baseDir = path.dirname(filePath);
        const baseName = path.basename(filePath, '.sql');
        if (fs.existsSync(baseDir)) {
            for (const f of fs.readdirSync(baseDir)) {
                if (f.startsWith(baseName + '_') && f.endsWith('.sql')) {
                    const sql = fs.readFileSync(path.join(baseDir, f), 'utf-8');
                    return this.executeMigration(sql, path.join(baseDir, f));
                }
            }
        }
        return { success: false, message: `Migration file not found: ${filePath}` };
    }
    async executeMigration(sql, sourceName = 'inline') {
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: this.dbHost,
                port: this.dbPort,
                database: 'postgres',
                user: 'postgres',
                password: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                ssl: { rejectUnauthorized: false, servername: this.poolerSni },
                connectionTimeoutMillis: 15000,
            });
            await client.connect();
            this.logger.log(`postgres connected: ${this.dbHost}`);
            const isPooler = this.dbPort === 6543 || this.dbHost.includes('pooler');
            if (isPooler) {
                this.logger.log('pooler mode: using transaction-per-statement for safety');
            }
            const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
            let executed = 0;
            let skipped = 0;
            const rows = [];
            for (const stmt of statements) {
                try {
                    const result = isPooler
                        ? await (async () => { await client.query('BEGIN'); const r = await client.query(stmt); await client.query('COMMIT'); return r; })()
                        : await client.query(stmt);
                    executed++;
                    rows.push({ statement: stmt.substring(0, 80) + '...', rowCount: result.rowCount || 0 });
                    this.logger.log(`executed: ${stmt.substring(0, 80)}`);
                }
                catch (err) {
                    const e = err;
                    if (e.message.includes('already exists') || e.message.includes('IF NOT EXISTS') ||
                        e.message.includes('duplicate') || e.message.includes('does not exist')) {
                        skipped++;
                        this.logger.log(`skipped (already exists): ${stmt.substring(0, 80)}`);
                    }
                    else {
                        await client.end().catch(() => { });
                        throw e;
                    }
                }
            }
            await client.end();
            return {
                success: true,
                message: `migration complete: ${executed} executed, ${skipped} skipped`,
                executedMigrations: [sourceName],
                rows,
            };
        }
        catch (e) {
            const err = e;
            return {
                success: false,
                message: `connection failed: ${err.message.substring(0, 300)}`,
                error: err.message.substring(0, 300),
            };
        }
    }
};
exports.DbMigrationService = DbMigrationService;
exports.DbMigrationService = DbMigrationService = DbMigrationService_1 = __decorate([
    (0, common_2.Injectable)()
], DbMigrationService);
let DbMigrationController = DbMigrationController_1 = class DbMigrationController {
    service;
    logger = new common_1.Logger(DbMigrationController_1.name);
    constructor(service) {
        this.service = service;
    }
    async testConnection(token) {
        const expectedToken = process.env.MIGRATION_TOKEN || '';
        if (expectedToken && token !== expectedToken) {
            return { success: false, message: 'Unauthorized' };
        }
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: this.service.dbHost,
                port: this.service.dbPort,
                database: 'postgres',
                user: 'postgres',
                password: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                ssl: { rejectUnauthorized: false, servername: this.service.poolerSni },
                connectionTimeoutMillis: 10000,
            });
            await client.connect();
            const result = await client.query('SELECT current_database(), current_user, inet_server_addr(), version()');
            await client.end();
            return {
                success: true,
                message: 'connected successfully',
                host: this.service.dbHost,
                port: this.service.dbPort,
            };
        }
        catch (e) {
            const err = e;
            return { success: false, message: err.message.substring(0, 500) };
        }
    }
    async runMigrations(body, token) {
        const expectedToken = process.env.MIGRATION_TOKEN || '';
        if (expectedToken && token !== expectedToken) {
            return { success: false, message: 'Unauthorized' };
        }
        const results = [];
        if (body?.migrationId) {
            const candidates = [
                path.join(process.cwd(), 'supabase', 'migrations', `${body.migrationId}.sql`),
                path.join(process.cwd(), '..', 'supabase', 'migrations', `${body.migrationId}.sql`),
                path.join(process.cwd(), 'apps', 'api', 'supabase', 'migrations', `${body.migrationId}.sql`),
                path.resolve(`supabase/migrations/${body.migrationId}.sql`),
                '/workspace/supabase/migrations/' + body.migrationId + '.sql',
                path.resolve(`scripts/migrations/${body.migrationId}.sql`),
                '/workspace/scripts/migrations/' + body.migrationId + '.sql',
                '/app/supabase/migrations/' + body.migrationId + '.sql',
                '/app/scripts/migrations/' + body.migrationId + '.sql',
            ];
            for (const p of candidates) {
                if (fs.existsSync(p)) {
                    const result = await this.service.runMigrationFile(p);
                    results.push(result);
                    break;
                }
            }
            if (results.length === 0) {
                const migrationDirs = [
                    path.resolve('supabase/migrations'),
                    path.resolve('scripts/migrations'),
                    '/app/supabase/migrations',
                    '/app/scripts/migrations',
                ];
                for (const dir of migrationDirs) {
                    if (fs.existsSync(dir)) {
                        for (const f of fs.readdirSync(dir)) {
                            if (f.startsWith(body.migrationId + '_') && f.endsWith('.sql')) {
                                try {
                                    const result = await this.service.runMigrationFile(path.resolve(path.join(dir, f)));
                                    results.push(result);
                                    break;
                                }
                                catch { }
                            }
                        }
                    }
                    if (results.length > 0)
                        break;
                }
            }
            if (results.length === 0) {
                return { success: false, message: `migration file not found for id: ${body.migrationId}` };
            }
            const overall = results.every(r => r.success);
            return {
                success: overall,
                message: overall
                    ? `migration ${body.migrationId} applied`
                    : `migration ${body.migrationId} had errors`,
                executedMigrations: [body.migrationId],
                error: overall ? undefined : results.find(r => !r.success)?.message,
            };
        }
        if (body?.files && Array.isArray(body.files) && body.files.length > 0) {
            for (const file of body.files) {
                const result = await this.service.runMigrationFile(file);
                results.push(result);
            }
            const overall = results.every(r => r.success);
            return {
                success: overall,
                message: overall
                    ? `all ${results.length} migrations applied`
                    : `some migrations had errors`,
                executedMigrations: results.map(r => (typeof r.executedMigrations === 'string' ? [r.executedMigrations] : r.executedMigrations || []).join(', ')).filter(Boolean),
                error: overall ? undefined : results.find(r => !r.success)?.message,
            };
        }
        if (body?.sql) {
            const result = await this.service.executeMigration(body.sql, 'inline');
            return result;
        }
        const candidates = [
            path.join(process.cwd(), 'supabase', 'migrations', '0015_automation_events_log.sql'),
            path.join(process.cwd(), '..', 'supabase', 'migrations', '0015_automation_events_log.sql'),
            path.join(process.cwd(), 'apps', 'api', 'supabase', 'migrations', '0015_automation_events_log.sql'),
            path.resolve('supabase/migrations/0015_automation_events_log.sql'),
            '/workspace/supabase/migrations/0015_automation_events_log.sql',
            path.resolve('scripts/migrations/0015_automation_events_log.sql'),
            '/workspace/scripts/migrations/0015_automation_events_log.sql',
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                const result = await this.service.runMigrationFile(p);
                return result;
            }
        }
        return { success: false, message: 'No SQL provided and no migration files found' };
    }
    async runSingleMigration(body, token) {
        return this.runMigrations(body, token);
    }
};
exports.DbMigrationController = DbMigrationController;
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
__decorate([
    (0, common_1.Post)('run-migration'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-migration-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DbMigrationController.prototype, "runSingleMigration", null);
exports.DbMigrationController = DbMigrationController = DbMigrationController_1 = __decorate([
    (0, common_1.Controller)('db'),
    __metadata("design:paramtypes", [DbMigrationService])
], DbMigrationController);
//# sourceMappingURL=db-migration.controller.js.map