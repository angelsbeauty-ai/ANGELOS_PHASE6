"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSupabaseClient = exports.createServiceSupabaseClient = void 0;
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
exports.createServiceSupabaseClient = createServiceSupabaseClient;
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
exports.createUserSupabaseClient = createUserSupabaseClient;
//# sourceMappingURL=supabase.js.map