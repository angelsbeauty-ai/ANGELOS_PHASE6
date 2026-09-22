"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_1 = require("./config/env");
async function bootstrap() {
    const runtime = (0, env_1.validateRuntimeEnvironment)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true, rawBody: true });
    const express = app.getHttpAdapter().getInstance();
    express.disable('x-powered-by');
    if (runtime.trustProxyHops > 0)
        express.set('trust proxy', runtime.trustProxyHops);
    app.enableCors({
        origin: runtime.corsOrigins.length > 0 ? runtime.corsOrigins : true,
        credentials: false,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key']
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true
    }));
    app.enableShutdownHooks();
    await app.listen(runtime.port, '0.0.0.0');
    common_1.Logger.log(`AngelOS API listening on ${runtime.port} (${runtime.environment})`);
}
bootstrap().catch((error) => {
    common_1.Logger.error('AngelOS API failed to start', error instanceof Error ? error.stack : String(error));
    process.exit(1);
});
//# sourceMappingURL=main.js.map