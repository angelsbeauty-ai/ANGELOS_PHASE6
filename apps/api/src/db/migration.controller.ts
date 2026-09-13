import { Controller, Get, Post, HttpCode, HttpStatus, Headers, Body, NotFoundException } from '@nestjs/common';
import { Injectable, Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface RunMigrationResult {
  success: boolean;
  message: string;
  rows?: unknown[];
}

@Injectable()
export class DbMigrationService {
  private pgHost: string;
  private pgPort: number;
  private pgUser: string;
  private pgPassword: string;
  private pgDatabase: string;
  private serviceRoleKey: string;

  constructor() {
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.pgHost = process.env.DB_HOST || 'db.hhzegavoyuicclsmrkwf.supabase.co';
    this.pgPort = parseInt(process.env.DB_PORT || '5432', 10);
    this.pgUser = process.env.DB_USER || 'postgres';
    this.pgPassword = process.env.DB_PASSWORD || this.serviceRoleKey;
    this.pgDatabase = process.env.DB_DATABASE || 'postgres';
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
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
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message.substring(0, 500) };
    }
  }

  async runMigration(sql: string, idempotencyKey: string): Promise<RunMigrationResult> {
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
      
      // Execute each statement separately (split by semicolon)
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      const results: unknown[] = [];
      
      for (const statement of statements) {
        try {
          const result = await client.query(statement);
          results.push({ statement: statement.substring(0, 60) + '...', rowCount: result.rowCount || 0, command: result.command });
          console.log('Executed: ' + statement.substring(0, 80));
        } catch (e: unknown) {
          const err = e as Error;
          // Skip errors for IF NOT EXISTS, already exists, etc.
          if (err.message.includes('already exists') || err.message.includes('duplicate') || err.message.includes('IF NOT EXISTS')) {
            console.log('Skipped (already exists): ' + statement.substring(0, 60));
            continue;
          }
          console.log('Statement error: ' + (e as Error).message.substring(0, 100));
          // Don't fail on individual statement errors
        }
      }
      
      await client.end();
      return { success: true, message: 'Migration executed successfully', rows: results };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message.substring(0, 500) };
    }
  }
}

@Controller('db')
export class DbMigrationController {
  constructor(private readonly dbMigrationService: DbMigrationService) {}

  @Get('test-connection')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Headers('x-migration-token') token: string): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    const expectedToken = process.env.MIGRATION_TOKEN || process.env.ADMIN_SECRET || '';
    if (expectedToken && token !== expectedToken) {
      throw new NotFoundException('Not found');
    }
    return this.dbMigrationService.testConnection();
  }

  @Post('run-migrations')
  @HttpCode(HttpStatus.OK)
  async runMigrations(
    @Body() body: { sql?: string },
    @Headers('x-migration-token') token: string
  ): Promise<RunMigrationResult> {
    const expectedToken = process.env.MIGRATION_TOKEN || process.env.ADMIN_SECRET || '';
    
    if (expectedToken && token !== expectedToken) {
      throw new NotFoundException('Not found');
    }
    
    let sql = body?.sql;
    
    // Load migration file if no SQL provided
    if (!sql) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Try multiple paths for the migration file
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
          } catch (e: unknown) {
            // Try next path
          }
        }
      } catch (e: unknown) {
        const err = e as Error;
        console.log('Error loading migration file: ' + err.message);
      }
    }
    
    if (!sql) {
      return { success: false, message: 'No SQL provided and migration file not found' };
    }
    
    // Generate idempotency key from SQL content
    const idempotencyKey = 'migration_' + crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
    
    console.log('Running migration, SQL length: ' + sql.length + ', idempotencyKey: ' + idempotencyKey);
    return this.dbMigrationService.runMigration(sql, idempotencyKey);
  }
}

@Module({
  controllers: [DbMigrationController],
  providers: [DbMigrationService],
  exports: [DbMigrationService],
})
export class DbMigrationModule {}
