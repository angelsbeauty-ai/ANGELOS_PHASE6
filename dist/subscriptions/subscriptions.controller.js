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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const change_plan_dto_1 = require("./dto/change-plan.dto");
const redeem_student_discount_dto_1 = require("./dto/redeem-student-discount.dto");
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionsController = class SubscriptionsController {
    subscriptions;
    constructor(subscriptions) {
        this.subscriptions = subscriptions;
    }
    status(user, workspaceId) { return this.subscriptions.getStatus(user, workspaceId); }
    checkout(user, workspaceId, dto) { return this.subscriptions.selectPlan(user, workspaceId, dto.billingInterval); }
    cancel(user, workspaceId) { return this.subscriptions.cancel(user, workspaceId); }
    reactivateDemo(user, workspaceId, dto) { return this.subscriptions.reactivateDemo(user, workspaceId, dto.billingInterval); }
    studentDiscount(user, workspaceId, dto) { return this.subscriptions.redeemStudentDiscount(user, workspaceId, dto.token); }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, change_plan_dto_1.ChangePlanDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('reactivate-demo'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, change_plan_dto_1.ChangePlanDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "reactivateDemo", null);
__decorate([
    (0, common_1.Post)('student-discount'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, redeem_student_discount_dto_1.RedeemStudentDiscountDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "studentDiscount", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/subscription'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map