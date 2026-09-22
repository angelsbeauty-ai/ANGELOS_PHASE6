"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let ProductAnalyticsService = exports.ProductAnalyticsService = class ProductAnalyticsService {
    async track(user, workspaceId, dto) {
        const userClient = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: workspace } = await userClient.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
        if (!workspace)
            throw new common_1.NotFoundException('Workspace not found');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const safeScreen = dto.screen ? dto.screen.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id') : null;
        const { error } = await service.from('product_usage_events').insert({ workspace_id: workspaceId, user_id: user.id, event_name: dto.eventName, screen: safeScreen, feature: dto.feature ?? null, action_key: dto.actionKey ?? null, outcome: dto.outcome ?? null, duration_ms: dto.durationMs ?? null });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { recorded: true };
    }
};
exports.ProductAnalyticsService = ProductAnalyticsService = __decorate([
    (0, common_1.Injectable)()
], ProductAnalyticsService);
//# sourceMappingURL=product-analytics.service.js.map