import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateRuntimeEnvironment } from './config/env';

async function bootstrap() {
  const runtime = validateRuntimeEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const express = app.getHttpAdapter().getInstance();

  express.disable('x-powered-by');
  if (runtime.trustProxyHops > 0) express.set('trust proxy', runtime.trustProxyHops);

  app.enableCors({
    origin: runtime.corsOrigins.length > 0 ? runtime.corsOrigins : true,
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key']
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: true
  }));
  app.enableShutdownHooks();

  await app.listen(runtime.port, '0.0.0.0');
  Logger.log(`AngelOS API listening on ${runtime.port} (${runtime.environment})`);
}

bootstrap().catch((error) => {
  Logger.error('AngelOS API failed to start', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
