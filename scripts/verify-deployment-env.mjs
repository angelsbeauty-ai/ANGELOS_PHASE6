const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

const clientKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
if (!clientKey) {
  console.error('Missing SUPABASE_PUBLISHABLE_KEY (preferred) or SUPABASE_ANON_KEY.');
  process.exit(1);
}

for (const name of required) {
  if (!process.env[name]?.trim()) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
}

if ((process.env.NODE_ENV ?? '').trim() !== 'staging') {
  console.error('NODE_ENV must be staging for this verifier.');
  process.exit(1);
}
if ((process.env.AI_PROVIDER_MODE ?? '').trim() !== 'openai') {
  console.error('AI_PROVIDER_MODE must be openai for realistic staging.');
  process.exit(1);
}
if ((process.env.BILLING_DEMO_MODE ?? '').trim() === 'true') {
  console.error('BILLING_DEMO_MODE must not be true for realistic staging.');
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(process.env.SUPABASE_URL.trim())) {
  console.error('SUPABASE_URL does not look like a Supabase project URL.');
  process.exit(1);
}

console.log('AngelOS staging deployment environment looks complete.');
