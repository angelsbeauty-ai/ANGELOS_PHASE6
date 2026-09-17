import { Global, Module } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line
  var supabaseServiceInstance: SupabaseService | undefined;
}

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseService {
  private clients: Map<string, SupabaseClient> = new Map();

  createServiceSupabaseClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    const key = `${url}:service`;
    if (!this.clients.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = { auth: { persistSession: false, autoRefreshToken: false } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.clients.set(key, createClient(url, serviceRoleKey, opts));
    }
    return this.clients.get(key)!;
  }

  createUserSupabaseClient(accessToken: string): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const clientKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

    if (!url || !clientKey) {
      throw new Error('SUPABASE_URL and a publishable/anon client key are required');
    }

    const key = `${url}:${accessToken.slice(0, 8)}`;
    if (!this.clients.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.clients.set(key, createClient(url, clientKey, opts));
    }
    return this.clients.get(key)!;
  }
}
// rebuild 1789684632
// rebuild 1789684919
