"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRuntimeEnvironment = void 0;
function required(name) {
    const value = process.env[name]?.trim();
    if (!value)
        throw new Error(`${name} is required`);
    return value;
}
function parseEnvironment() {
    const value = (process.env.NODE_ENV ?? 'development').trim();
    if (!['development', 'test', 'staging', 'production'].includes(value)) {
        throw new Error(`NODE_ENV must be development, test, staging, or production (received ${value})`);
    }
    return value;
}
function parseOrigins(raw, environment) {
    const origins = String(raw ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    if (environment === 'production' && origins.length === 0) {
        throw new Error('CORS_ORIGINS is required in production');
    }
    return origins;
}
function validateRuntimeEnvironment() {
    const environment = parseEnvironment();
    required('SUPABASE_URL');
    if (!(process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim())) {
        throw new Error('SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is required');
    }
    required('SUPABASE_SERVICE_ROLE_KEY');
    const providerMode = (process.env.AI_PROVIDER_MODE ?? 'mock').trim();
    if (!['mock', 'openai'].includes(providerMode)) {
        throw new Error('AI_PROVIDER_MODE must be mock or openai');
    }
    if (providerMode === 'openai')
        required('OPENAI_API_KEY');
    if (environment === 'production' && process.env.BILLING_DEMO_MODE === 'true') {
        throw new Error('BILLING_DEMO_MODE must never be true in production');
    }
    if (environment === 'production' && providerMode === 'mock') {
        throw new Error('AI_PROVIDER_MODE=mock is not allowed in production');
    }
    const port = Number(process.env.PORT ?? 3000);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error('PORT must be a valid TCP port');
    }
    const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
    if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
        throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10');
    }
    return {
        environment,
        port,
        corsOrigins: parseOrigins(process.env.CORS_ORIGINS, environment),
        trustProxyHops
    };
}
exports.validateRuntimeEnvironment = validateRuntimeEnvironment;
//# sourceMappingURL=env.js.map