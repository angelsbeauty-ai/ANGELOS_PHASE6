"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const analytics_service_1 = require("./analytics.service");
const record_audience_activity_dto_1 = require("./dto/record-audience-activity.dto");
const record_content_metrics_dto_1 = require("./dto/record-content-metrics.dto");
const update_marketing_profile_dto_1 = require("./dto/update-marketing-profile.dto");
let AnalyticsController = class AnalyticsController {
    analytics;
    constructor(analytics) {
        this.analytics = analytics;
    }
    overview(user, workspaceId, days) {
        return this.analytics.overview(user, workspaceId, Number(days ?? 30));
    }
    getMarketingProfile(user, workspaceId) {
        return this.analytics.getMarketingProfile(user, workspaceId);
    }
    updateMarketingProfile(user, workspaceId, dto) {
        return this.analytics.updateMarketingProfile(user, workspaceId, dto);
    }
    recordContentMetrics(user, workspaceId, variantId, dto) {
        return this.analytics.recordContentMetrics(user, workspaceId, variantId, dto);
    }
    recordAudienceActivity(user, workspaceId, dto) {
        return this.analytics.recordAudienceActivity(user, workspaceId, dto);
    }
    marketingCoach(user, workspaceId, days) {
        return this.analytics.marketingCoach(user, workspaceId, Number(days ?? 30));
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('marketing-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getMarketingProfile", null);
__decorate([
    (0, common_1.Patch)('marketing-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_marketing_profile_dto_1.UpdateMarketingProfileDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "updateMarketingProfile", null);
__decorate([
    (0, common_1.Post)('content/:variantId/metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('variantId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, record_content_metrics_dto_1.RecordContentMetricsDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "recordContentMetrics", null);
__decorate([
    (0, common_1.Post)('audience-activity'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_audience_activity_dto_1.RecordAudienceActivityDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "recordAudienceActivity", null);
__decorate([
    (0, common_1.Post)('marketing-coach'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "marketingCoach", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/analytics'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map