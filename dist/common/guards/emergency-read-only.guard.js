"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyReadOnlyGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let EmergencyReadOnlyGuard = class EmergencyReadOnlyGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = String(request.method ?? 'GET').toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return true;
        const workspaceId = request.params?.workspaceId;
        if (!workspaceId)
            return true;
        const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
        if (/\/workspaces\/[^/]+\/(system-health|subscription|product-analytics|beta)(\/|$)/.test(path))
            return true;
        if (/\/workspaces\/[^/]+\/ai\/conversations(\/|$)/.test(path))
            return true;
        if (/\/workspaces\/[^/]+\/ai\/actions\/[^/]+\/cancel\/?$/.test(path))
            return true;
        const header = String(request.headers?.authorization ?? '');
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (!token)
            return true;
        const userClient = (0, supabase_1.createUserSupabaseClient)(token);
        const { data: workspace, error: workspaceError } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (workspaceError)
            throw new common_1.ServiceUnavailableException('Workspace safety check unavailable');
        if (!workspace)
            return true;
        const { data: controls, error: controlsError } = await userClient.from('workspace_operational_controls').select('emergency_read_only').eq('workspace_id', workspaceId).maybeSingle();
        if (controlsError || !controls)
            throw new common_1.ServiceUnavailableException('Operational safety controls unavailable');
        if (controls.emergency_read_only) {
            throw new common_1.ConflictException('AngelOS is in emergency read-only mode. Business-changing actions are paused until the owner resumes them.');
        }
        return true;
    }
};
exports.EmergencyReadOnlyGuard = EmergencyReadOnlyGuard;
exports.EmergencyReadOnlyGuard = EmergencyReadOnlyGuard = __decorate([
    (0, common_1.Injectable)()
], EmergencyReadOnlyGuard);
//# sourceMappingURL=emergency-read-only.guard.js.map