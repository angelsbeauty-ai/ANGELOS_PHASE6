"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseAuthGuard = exports.SupabaseAuthGuard = class SupabaseAuthGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        const accessToken = authorization.slice('Bearer '.length);
        const url = process.env.SUPABASE_URL;
        const clientKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!url || !clientKey) {
            throw new common_1.UnauthorizedException('Authentication is not configured');
        }
        const supabase = (0, supabase_js_1.createClient)(url, clientKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (error || !data.user) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        const user = {
            id: data.user.id,
            email: data.user.email,
            accessToken
        };
        request.user = user;
        return true;
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)()
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map