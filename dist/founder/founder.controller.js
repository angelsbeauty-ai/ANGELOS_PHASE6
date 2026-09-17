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
exports.FounderController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_student_discount_dto_1 = require("./dto/create-student-discount.dto");
const update_feature_flag_dto_1 = require("./dto/update-feature-flag.dto");
const founder_guard_1 = require("./founder.guard");
const founder_service_1 = require("./founder.service");
const beta_service_1 = require("../beta/beta.service");
const create_beta_invite_dto_1 = require("../beta/dto/create-beta-invite.dto");
const update_beta_feedback_dto_1 = require("../beta/dto/update-beta-feedback.dto");
let FounderController = class FounderController {
    founder;
    beta;
    constructor(founder, beta) {
        this.founder = founder;
        this.beta = beta;
    }
    me(user) { return this.founder.me(user); }
    overview() { return this.founder.overview(); }
    workspaces() { return this.founder.workspaces(); }
    flags() { return this.founder.featureFlags(); }
    updateFlag(user, key, dto) { return this.founder.updateFeatureFlag(user, key, dto); }
    betaOverview() { return this.beta.overview(); }
    betaInvites() { return this.beta.listInvites(); }
    createBetaInvite(user, dto) { return this.beta.createInvite(user, dto); }
    revokeBetaInvite(id) { return this.beta.revokeInvite(id); }
    revokeBetaTester(userId) { return this.beta.revokeTester(userId); }
    betaFeedback() { return this.beta.listFeedback(); }
    updateBetaFeedback(id, dto) { return this.beta.updateFeedback(id, dto); }
    discounts() { return this.founder.listStudentDiscounts(); }
    createDiscount(user, dto) { return this.founder.createStudentDiscount(user, dto); }
    revokeDiscount(id) { return this.founder.revokeStudentDiscount(id); }
};
exports.FounderController = FounderController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('workspaces'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "workspaces", null);
__decorate([
    (0, common_1.Get)('feature-flags'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "flags", null);
__decorate([
    (0, common_1.Patch)('feature-flags/:key'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_feature_flag_dto_1.UpdateFeatureFlagDto]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "updateFlag", null);
__decorate([
    (0, common_1.Get)('beta/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "betaOverview", null);
__decorate([
    (0, common_1.Get)('beta/invites'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "betaInvites", null);
__decorate([
    (0, common_1.Post)('beta/invites'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_beta_invite_dto_1.CreateBetaInviteDto]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "createBetaInvite", null);
__decorate([
    (0, common_1.Post)('beta/invites/:id/revoke'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "revokeBetaInvite", null);
__decorate([
    (0, common_1.Post)('beta/testers/:userId/revoke'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "revokeBetaTester", null);
__decorate([
    (0, common_1.Get)('beta/feedback'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "betaFeedback", null);
__decorate([
    (0, common_1.Patch)('beta/feedback/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_beta_feedback_dto_1.UpdateBetaFeedbackDto]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "updateBetaFeedback", null);
__decorate([
    (0, common_1.Get)('student-discounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "discounts", null);
__decorate([
    (0, common_1.Post)('student-discounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_student_discount_dto_1.CreateStudentDiscountDto]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "createDiscount", null);
__decorate([
    (0, common_1.Post)('student-discounts/:id/revoke'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FounderController.prototype, "revokeDiscount", null);
exports.FounderController = FounderController = __decorate([
    (0, common_1.Controller)('founder'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, founder_guard_1.FounderGuard),
    __metadata("design:paramtypes", [founder_service_1.FounderService, beta_service_1.BetaService])
], FounderController);
//# sourceMappingURL=founder.controller.js.map