const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const isReleaseLike = appEnv === 'staging' || appEnv === 'production';

function requireReleaseValue(name: string, value: string | undefined, developmentFallback: string): string {
  if (value && value.trim()) return value.trim();
  if (isReleaseLike) {
    throw new Error(`${name} is required for AngelOS ${appEnv} builds.`);
  }
  return developmentFallback;
}

export const runtimeConfig = {
  appEnv,
  apiUrl: requireReleaseValue('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL, 'http://localhost:3000'),
  supabaseUrl: requireReleaseValue(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    'https://placeholder.invalid'
  ),
  supabaseClientKey: requireReleaseValue(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy EXPO_PUBLIC_SUPABASE_ANON_KEY)',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'placeholder'
  )
} as const;
