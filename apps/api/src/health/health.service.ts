import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  liveness() {
    return {
      status: 'healthy',
      service: 'angelos-api',
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.RELEASE_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    return {
      status: 'ready',
      service: 'angelos-api',
      checks: { database: 'ready' },
      latencyMs: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
