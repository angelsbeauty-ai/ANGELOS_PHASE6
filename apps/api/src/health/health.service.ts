import { Injectable, Logger } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  liveness() {
    return {
      status: 'healthy',
      service: 'angelos-api',
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.RELEASE_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
      timestamp: new Date().toISOString()
    };
  }

  async readiness() {
    const startedAt = Date.now();
    try {
      const supabase = createServiceSupabaseClient();
      const { error } = await supabase
        .from('platform_release_state')
        .select('id')
        .eq('id', 'main')
        .maybeSingle();
      if (error) throw error;

      return {
        status: 'ready',
        service: 'angelos-api',
        checks: { database: 'ready' },
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.warn(`Database readiness check failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: 'not_ready',
        service: 'angelos-api',
        checks: { database: 'not_ready' },
        error: 'database_unavailable',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString()
      };
    }
  }
}
