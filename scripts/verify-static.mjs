import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const required = [
  'apps/api/src/main.ts',
  'apps/api/src/config/env.ts',
  'apps/api/src/health/health.controller.ts',
  'apps/mobile/eas.json',
  'apps/mobile/app.config.js',
  'apps/mobile/src/lib/supabase.ts',
  'railway.json',
  '.github/workflows/ci.yml',
  '.github/workflows/staging.yml',
  'STAGING_RUNBOOK.md',
  'PRODUCTION_HARDENING_PHASE_2.md',
  'scripts/staging-smoke.mjs'
];

for (const relative of required) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing required production-hardening file: ${relative}`);
}

const apiEnv = fs.readFileSync(path.join(root, 'apps/api/.env.example'), 'utf8');
for (const name of ['NODE_ENV', 'CORS_ORIGINS', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BILLING_DEMO_MODE']) {
  if (!apiEnv.includes(`${name}=`)) throw new Error(`apps/api/.env.example is missing ${name}`);
}

const main = fs.readFileSync(path.join(root, 'apps/api/src/main.ts'), 'utf8');
if (!main.includes('validateRuntimeEnvironment')) throw new Error('API must validate runtime environment before listen');
if (!main.includes('enableShutdownHooks')) throw new Error('API must enable graceful shutdown hooks');

const mobileSupabase = fs.readFileSync(path.join(root, 'apps/mobile/src/lib/supabase.ts'), 'utf8');
if (!mobileSupabase.includes('AsyncStorage')) throw new Error('Mobile Supabase auth must use explicit persistent storage');

const dockerfile = fs.readFileSync(path.join(root, 'apps/api/Dockerfile'), 'utf8');
if (!dockerfile.includes('USER node')) throw new Error('API runtime container must not run as root');
if (dockerfile.includes('apps/mobile')) throw new Error('API container must not install/copy mobile app dependencies');

const appConfig = fs.readFileSync(path.join(root, 'apps/mobile/app.config.js'), 'utf8');
if (!appConfig.includes('.staging') || !appConfig.includes('.dev')) throw new Error('Mobile dynamic config must isolate staging/development app identifiers');


const healthService = fs.readFileSync(path.join(root, 'apps/api/src/health/health.service.ts'), 'utf8');
if (!healthService.includes("error: 'database_unavailable'")) throw new Error('Readiness endpoint must expose a safe public error code');
if (healthService.includes("error: error instanceof Error ? error.message")) throw new Error('Readiness response must not expose raw database error messages');

if (!healthService.includes("RAILWAY_GIT_COMMIT_SHA")) throw new Error('Liveness should expose a release identifier for staging verification');


const eas = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/eas.json'), 'utf8'));
if (eas.build?.staging?.environment !== 'preview') throw new Error('Staging EAS build must map to the preview EAS environment');

console.log('AngelOS production static verification passed.');
