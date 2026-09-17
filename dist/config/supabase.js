"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceSupabaseClient = createServiceSupabaseClient;
exports.createUserSupabaseClient = createUserSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
function createServiceSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    return (0, supabase_js_1.createClient)(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}
function createUserSupabaseClient(accessToken) {
    const url = process.env.SUPABASE_URL;
    const clientKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !clientKey) {
        throw new Error('SUPABASE_URL and a publishable/anon client key are required');
    }
    return (0, supabase_js_1.createClient)(url, clientKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false }
    });
}
//# sourceMappingURL=supabase.js.map