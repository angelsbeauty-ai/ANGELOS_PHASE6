const env = process.env.EXPO_PUBLIC_APP_ENV || 'staging';
const releaseLike = env === 'staging' || env === 'production';

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_API_URL'];
const missing = required.filter((name) => !process.env[name]?.trim());
const hasClientKey = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
);
if (!hasClientKey) missing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

const problems = [];
if (releaseLike && missing.length) problems.push(`missing: ${missing.join(', ')}`);

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
if (releaseLike && apiUrl && !apiUrl.startsWith('https://')) problems.push('EXPO_PUBLIC_API_URL must use https://');
if (releaseLike && supabaseUrl && !supabaseUrl.startsWith('https://')) problems.push('EXPO_PUBLIC_SUPABASE_URL must use https://');
if (releaseLike && apiUrl && /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(apiUrl)) problems.push('EXPO_PUBLIC_API_URL cannot point to localhost');
if (releaseLike && supabaseUrl && /(placeholder\.invalid|localhost|127\.0\.0\.1)/i.test(supabaseUrl)) problems.push('EXPO_PUBLIC_SUPABASE_URL is not a live Supabase URL');

if (problems.length) {
  console.error(`AngelOS mobile ${env} preflight failed:`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`AngelOS mobile ${env} environment preflight passed.`);
