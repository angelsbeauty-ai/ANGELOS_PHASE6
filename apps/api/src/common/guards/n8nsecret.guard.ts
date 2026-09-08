import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Shared-secret guard for n8n-internal endpoints.
 * n8n includes X-N8N-Secret header with the shared secret.
 * The secret is configured via N8N_HERMES_SECRET env var.
 *
 * This is used for:
 * - POST /hermes/tasks (n8n creates a task from Telegram)
 * - GET /hermes/overview (n8n gets status for /status command)
 * - POST /hermes/n8n/execute (n8n triggers Hermes Builder)
 * - POST /hermes/n8n/callback (Hermes Builder → n8n callback, protected in both directions)
 */
@Injectable()
export class N8nSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerSecret = request.headers['x-n8n-secret'] as string | undefined;
    const envSecret = process.env.N8N_HERMES_SECRET;

    if (!envSecret) {
      // If no secret is configured, reject all — don't accidentally expose
      throw new UnauthorizedException('N8N_HERMES_SECRET not configured');
    }

    if (!headerSecret || headerSecret !== envSecret) {
      throw new UnauthorizedException('Invalid n8n secret');
    }

    return true;
  }
}
