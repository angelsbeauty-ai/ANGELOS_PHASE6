import { Controller, Get, Post, HttpCode, HttpStatus, Headers, Body, NotFoundException, Logger } from '@nestjs/common';
import { Injectable, Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MigrationResult {
  success: boolean;
  message: string;
  executed?: number;
  skipped?: number;
  rows?: unknown[];
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

  async executeMigration(sql: string): Promise<MigrationResult> {
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
      this.logger.log('postgres 연결됨: ' + this.dbHost);

      const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
      let executed = 0;
      let skipped = 0;
      const rows = [];

      for (const stmt of statements) {
        try {
          const result = await client.query(stmt);
          executed++;
          rows.push({ statement: stmt.substring(0, 80) + '...', rowCount: result.rowCount || 0 });
          this.logger.log('실행: ' + stmt.substring(0, 80));
        } catch (err: unknown) {
          const e = err as Error;
          if (e.message.includes('already exists') || e.message.includes('IF NOT EXISTS') ||
              e.message.includes('duplicate') || e.message.includes('does not exist')) {
            skipped++;
            this.logger.log('스킵 (이미 존재): ' + stmt.substring(0, 80));
          } else {
            this.logger.warn('문장 오류: ' + e.message.substring(0, 150));
            rows.push({ statement: stmt.substring(0, 80) + '...', error: e.message.substring(0, 200) });
          }
        }
      }

      await client.end();

      return {
        success: true,
        message: '마이그레이션 완료: ' + executed + ' 실행, ' + skipped + ' 스킵',
        executed,
        skipped,
        rows,
      };
    } catch (e: unknown) {
      const err = e as Error;
      return {
        success: false,
        message: '연결 실패: ' + err.message.substring(0, 300),
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
        message: '연결 성공',
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
    @Body() body: { sql?: string },
    @Headers('x-migration-token') token: string,
  ): Promise<MigrationResult> {
    const expectedToken = process.env.MIGRATION_TOKEN || '';
    if (expectedToken && token !== expectedToken) {
      return { success: false, message: 'Unauthorized' };
    }

    let sql = body?.sql;
    if (!sql) {
      try {
        const cwd = process.cwd();
        const candidates = [
          path.join(cwd, 'supabase', 'migrations', '0015_automation_events_log.sql'),
          path.join(cwd, '..', 'supabase', 'migrations', '0015_automation_events_log.sql'),
          path.join(cwd, 'apps', 'api', 'supabase', 'migrations', '0015_automation_events_log.sql'),
          path.resolve('supabase/migrations/0015_automation_events_log.sql'),
          '/workspace/supabase/migrations/0015_automation_events_log.sql',
        ];
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            sql = fs.readFileSync(p, 'utf-8');
            this.logger.log('마이그레이션 파일 읽음: ' + p);
            break;
          }
        }
      } catch (e: unknown) {
        const err = e as Error;
        this.logger.warn('마이그레이션 파일 읽기 실패: ' + err.message);
      }
    }

    if (!sql) {
      return { success: false, message: 'SQL 없음 및 마이그레이션 파일 못 찾음' };
    }

    this.logger.log('마이그레이션 실행, SQL 길이: ' + sql.length);
    return this.service.executeMigration(sql);
  }
}

@Module({
  controllers: [DbMigrationController],
  providers: [DbMigrationService],
})
export class DbMigrationModule {}
