"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    clients = new Map();
    createServiceSupabaseClient() {
        const url = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }
        const key = `${url}:service`;
        if (!this.clients.has(key)) {
            this.clients.set(key, (0, supabase_js_1.createClient)(url, serviceRoleKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            }));
        }
        return this.clients.get(key);
    }
    createUserSupabaseClient(accessToken) {
        const url = process.env.SUPABASE_URL;
        const clientKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!url || !clientKey) {
            throw new Error('SUPABASE_URL and a publishable/anon client key are required');
        }
        const key = `${url}:${accessToken.slice(0, 8)}`;
        if (!this.clients.has(key)) {
            this.clients.set(key, (0, supabase_js_1.createClient)(url, clientKey, {
                global: { headers: { Authorization: `Bearer ${accessToken}` } },
                auth: { persistSession: false, autoRefreshToken: false }
            }));
        }
        return this.clients.get(key);
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [SupabaseService],
        exports: [SupabaseService],
    })
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map