import { SupabaseClient } from '@supabase/supabase-js';
declare global {
    var supabaseServiceInstance: SupabaseService | undefined;
}
export declare class SupabaseService {
    private clients;
    createServiceSupabaseClient(): SupabaseClient;
    createUserSupabaseClient(accessToken: string): SupabaseClient;
}
