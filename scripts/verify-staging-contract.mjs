import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const easPath = path.join(root, 'apps/mobile/eas.json');
const workflowPath = path.join(root, '.github/workflows/staging.yml');
const smokePath = path.join(root, 'scripts/staging-smoke.mjs');
const apiEnvPath = path.join(root, 'apps/api/.env.staging.example');
const mobileEnvPath = path.join(root, 'apps/mobile/.env.staging.example');

for (const file of [easPath, workflowPath, smokePath, apiEnvPath, mobileEnvPath]) {
  if (!fs.existsSync(file)) throw new Error(`Missing staging-hardening file: ${path.relative(root, file)}`);
}

const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
if (eas.build?.staging?.environment !== 'preview') throw new Error('EAS staging build must use the preview EAS environment');
if (eas.build?.production?.environment !== 'production') throw new Error('EAS production build must use the production EAS environment');
if (eas.build?.development?.environment !== 'development') throw new Error('EAS development build must use the development EAS environment');
if (eas.build?.staging?.env?.EXPO_PUBLIC_APP_ENV !== 'staging') throw new Error('Staging app variant must set EXPO_PUBLIC_APP_ENV=staging');

const apiStaging = fs.readFileSync(apiEnvPath, 'utf8');
for (const name of ['NODE_ENV=staging','SUPABASE_URL=','SUPABASE_PUBLISHABLE_KEY=','SUPABASE_SERVICE_ROLE_KEY=','AI_PROVIDER_MODE=openai','OPENAI_API_KEY=']) {
  if (!apiStaging.includes(name)) throw new Error(`API staging example missing ${name}`);
}
if (apiStaging.includes('BILLING_DEMO_MODE=true')) throw new Error('Staging API example must not enable demo billing');

const mobileStaging = fs.readFileSync(mobileEnvPath, 'utf8');
for (const name of ['EXPO_PUBLIC_APP_ENV=staging','EXPO_PUBLIC_SUPABASE_URL=','EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=','EXPO_PUBLIC_API_URL=']) {
  if (!mobileStaging.includes(name)) throw new Error(`Mobile staging example missing ${name}`);
}
if (mobileStaging.includes('SERVICE_ROLE') || mobileStaging.includes('OPENAI_API_KEY')) throw new Error('Mobile staging env must never contain server secrets');

console.log('AngelOS staging contract verification passed.');
