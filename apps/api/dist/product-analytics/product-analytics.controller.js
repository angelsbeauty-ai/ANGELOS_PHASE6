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
exports.ProductAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const track_product_event_dto_1 = require("./dto/track-product-event.dto");
const product_analytics_service_1 = require("./product-analytics.service");
let ProductAnalyticsController = exports.ProductAnalyticsController = class ProductAnalyticsController {
    analytics;
    constructor(analytics) {
        this.analytics = analytics;
    }
    track(user, workspaceId, dto) { return this.analytics.track(user, workspaceId, dto); }
};
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, track_product_event_dto_1.TrackProductEventDto]),
    __metadata("design:returntype", void 0)
], ProductAnalyticsController.prototype, "track", null);
exports.ProductAnalyticsController = ProductAnalyticsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/product-analytics'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [product_analytics_service_1.ProductAnalyticsService])
], ProductAnalyticsController);
//# sourceMappingURL=product-analytics.controller.js.map