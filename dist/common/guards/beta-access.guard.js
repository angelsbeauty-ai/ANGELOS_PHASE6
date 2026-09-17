"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let BetaAccessGuard = exports.BetaAccessGuard = class BetaAccessGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = String(request.method ?? 'GET').toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return true;
        const workspaceId = request.params?.workspaceId;
        if (!workspaceId)
            return true;
        const railwayEnv = String(process.env.RAILWAY_ENVIRONMENT ?? process.env.RAILWAY_ENVIRONMENT_NAME ?? '').toLowerCase();
        const nodeEnv = String(process.env.NODE_ENV ?? '').toLowerCase();
        if (railwayEnv === 'staging' || nodeEnv === 'staging' || process.env.STAGING_ALLOW_WRITES === 'true') {
            return true;
        }
        const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
        if (path.includes('/beta/') && path.endsWith('/feedback'))
            return true;
        const header = String(request.headers?.authorization ?? '');
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (!token)
            return true;
        const userClient = (0, supabase_1.createUserSupabaseClient)(token);
        const { data: auth } = await userClient.auth.getUser(token);
        const userId = auth.user?.id;
        if (!userId)
            return true;
        const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (!workspace)
            return true;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: release } = await service.from('platform_release_state').select('stage,public_signup_enabled').eq('id', 'main').maybeSingle();
        if (release?.public_signup_enabled || release?.stage === 'public')
            return true;
        const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
        if (envFounders.includes(userId))
            return true;
        const [{ data: founder }, { data: tester }] = await Promise.all([
            service.from('platform_founders').select('user_id').eq('user_id', userId).maybeSingle(),
            service.from('beta_testers').select('user_id').eq('user_id', userId).is('revoked_at', null).maybeSingle()
        ]);
        if (founder || tester)
            return true;
        throw new common_1.ForbiddenException('This workspace is no longer approved for the private AngelOS beta. Your data remains protected and readable, but business-changing actions are disabled.');
    }
};
exports.BetaAccessGuard = BetaAccessGuard = __decorate([
    (0, common_1.Injectable)()
], BetaAccessGuard);
//# sourceMappingURL=beta-access.guard.js.map