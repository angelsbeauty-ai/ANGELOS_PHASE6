"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformFeatureGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let PlatformFeatureGuard = class PlatformFeatureGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = String(request.method ?? 'GET').toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return true;
        const workspaceId = request.params?.workspaceId;
        if (!workspaceId)
            return true;
        const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
        const featureKey = this.featureFor(path, method);
        if (!featureKey)
            return true;
        const header = String(request.headers?.authorization ?? '');
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (!token)
            return true;
        const userClient = (0, supabase_1.createUserSupabaseClient)(token);
        const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (!workspace)
            return true;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const [{ data: globalFlag }, { data: override }] = await Promise.all([
            service.from('platform_feature_flags').select('enabled,stage,name').eq('key', featureKey).maybeSingle(),
            service.from('workspace_feature_overrides').select('enabled').eq('workspace_id', workspaceId).eq('feature_key', featureKey).maybeSingle()
        ]);
        const enabled = override?.enabled ?? (globalFlag?.enabled && !['paused', 'off'].includes(globalFlag.stage));
        if (!enabled)
            throw new common_1.ServiceUnavailableException(`${globalFlag?.name ?? featureKey} is temporarily unavailable. Other AngelOS features remain available.`);
        return true;
    }
    featureFor(path, method) {
        if (path.includes('/messaging/messages/') && path.endsWith('/approve-send'))
            return 'messaging_send';
        if (path.includes('/content/variants/') && path.endsWith('/publish'))
            return 'content_publishing';
        if (path.includes('/automations/process-due'))
            return 'automations_execution';
        if (path.includes('/analytics/marketing-coach'))
            return 'analytics_coach';
        if (path.includes('/ai/') && ['POST', 'PATCH', 'PUT'].includes(method))
            return 'ai_core';
        return null;
    }
};
exports.PlatformFeatureGuard = PlatformFeatureGuard;
exports.PlatformFeatureGuard = PlatformFeatureGuard = __decorate([
    (0, common_1.Injectable)()
], PlatformFeatureGuard);
//# sourceMappingURL=platform-feature.guard.js.map