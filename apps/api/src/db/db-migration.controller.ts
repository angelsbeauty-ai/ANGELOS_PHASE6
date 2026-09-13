import { Controller, Get, Post, HttpCode, HttpStatus, Headers, Body, NotFoundException, Logger } from '@nestjs/common';
import { Injectable, Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MigrationResult {
  success: boolean;
  message: string;
  executedMigrations?: string[];
  rows?: unknown[];
  error?: string;
}

@Injectable()
export class DbMigrationService {
  private readonly logger = new Logger(DbMigrationService.name);
  private readonly dbHost: string;
  private readonly dbPort: number;

  constructor() {
    const url = process.env.SUPABASE_URL || 'https://hhzegavoyuicclsmrkwf.supabase.co';
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    this.dbHost = 'db.' + (match ? match[1] : 'hhzegavoyuicclsmrkwf') + '.supabase.co';
    this.dbPort = 5432;
  }

  async runMigrationFile(filePath: string): Promise<MigrationResult> {
    if (!fs.existsSync(filePath)) {
      return { success: false, message: `Migration file not found: ${filePath}` };
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    return this.executeMigration(sql, filePath);
  }

  async executeMigration(sql: string, sourceName: string = 'inline'): Promise<MigrationResult> {
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: this.dbHost,
        port: this.dbPort,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        ssl: { rejectUnauthorized: false, servername: this.dbHost },
        connectionTimeoutMillis: 15000,
      });

      await client.connect();
      this.logger.log(`postgres connected: ${this.dbHost}`);

      const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
      let executed = 0;
      let skipped = 0;
      const rows = [];

      for (const stmt of statements) {
        try {
          const result = await client.query(stmt);
          executed++;
          rows.push({ statement: stmt.substring(0, 80) + '...', rowCount: result.rowCount || 0 });
          this.logger.log(`executed: ${stmt.substring(0, 80)}`);
        } catch (err: unknown) {
          const e = err as Error;
          if (e.message.includes('already exists') || e.message.includes('IF NOT EXISTS') ||
              e.message.includes('duplicate') || e.message.includes('does not exist')) {
            skipped++;
            this.logger.log(`skipped (already exists): ${stmt.substring(0, 80)}`);
          } else {
            this.logger.warn(`statement error: ${e.message.substring(0, 150)}`);
            rows.push({ statement: stmt.substring(0, 80) + '...', error: e.message.substring(0, 200) });
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
    } catch (e: unknown) {
      const err = e as Error;
      return {
        success: false,
        message: `connection failed: ${err.message.substring(0, 300)}`,
        error: err.message.substring(0, 300),
      };
    }
  }
}

@Controller('db')
export class DbMigrationController {
  private readonly logger = new Logger(DbMigrationController.name);
  constructor(private readonly service: DbMigrationService) {}

  @Get('test-connection')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Headers('x-migration-token') token: string): Promise<{ success: boolean; message: string; host?: string; port?: number }> {
    const expectedToken = process.env.MIGRATION_TOKEN || '';
    if (expectedToken && token !== expectedToken) {
      return { success: false, message: 'Unauthorized' };
    }
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: this.service['dbHost'] || 'db.hhzegavoyuicclsmrkwf.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        ssl: { rejectUnauthorized: false, servername: 'db.hhzegavoyuicclsmrkwf.supabase.co' },
        connectionTimeoutMillis: 10000,
      });
      await client.connect();
      const result = await client.query('SELECT current_database(), current_user, inet_server_addr(), version()');
      await client.end();
      return {
        success: true,
        message: 'connected successfully',
        host: this.service['dbHost'],
        port: 5432,
      };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message.substring(0, 500) };
    }
  }

  @Post('run-migrations')
  @HttpCode(HttpStatus.OK)
  async runMigrations(
    @Body() body: { sql?: string; migrationId?: string; files?: string[] },
    @Headers('x-migration-token') token: string,
  ): Promise<MigrationResult> {
    const expectedToken = process.env.MIGRATION_TOKEN || '';
    if (expectedToken && token !== expectedToken) {
      return { success: false, message: 'Unauthorized' };
    }

    const results: MigrationResult[] = [];

    // If migrationId provided, resolve to a specific file
    if (body?.migrationId) {
      const candidates = [
        path.join(process.cwd(), 'supabase', 'migrations', `${body.migrationId}.sql`),
        path.join(process.cwd(), '..', 'supabase', 'migrations', `${body.migrationId}.sql`),
        path.join(process.cwd(), 'apps', 'api', 'supabase', 'migrations', `${body.migrationId}.sql`),
        path.resolve(`supabase/migrations/${body.migrationId}.sql`),
        `/workspace/supabase/migrations/${body.migrationId}.sql`,
        path.resolve(`scripts/migrations/${body.migrationId}.sql`),
        `/workspace/scripts/migrations/${body.migrationId}.sql`,
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const result = await this.service.runMigrationFile(p);
          results.push(result);
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

    // If files array provided, run each
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

    // If sql provided, run inline
    if (body?.sql) {
      const result = await this.service.executeMigration(body.sql, 'inline');
      return result;
    }

    // Default: run 0015 (existing behavior)
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

  @Post('run-migration')
  @HttpCode(HttpStatus.OK)
  async runSingleMigration(
    @Body() body: { migrationId: string },
    @Headers('x-migration-token') token: string,
  ): Promise<MigrationResult> {
    return this.runMigrations(body, token);
  }
}

@Module({
  controllers: [DbMigrationController],
  providers: [DbMigrationService],
})
export class DbMigrationModule {}
