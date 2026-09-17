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
exports.BetaController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const beta_service_1 = require("./beta.service");
const redeem_beta_invite_dto_1 = require("./dto/redeem-beta-invite.dto");
const submit_beta_feedback_dto_1 = require("./dto/submit-beta-feedback.dto");
let BetaController = class BetaController {
    beta;
    constructor(beta) {
        this.beta = beta;
    }
    me(user) { return this.beta.me(user); }
    redeem(user, dto) { return this.beta.redeem(user, dto); }
    feedback(user, workspaceId, dto) { return this.beta.submitFeedback(user, workspaceId, dto); }
};
exports.BetaController = BetaController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BetaController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, redeem_beta_invite_dto_1.RedeemBetaInviteDto]),
    __metadata("design:returntype", void 0)
], BetaController.prototype, "redeem", null);
__decorate([
    (0, common_1.Post)('workspaces/:workspaceId/feedback'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_beta_feedback_dto_1.SubmitBetaFeedbackDto]),
    __metadata("design:returntype", void 0)
], BetaController.prototype, "feedback", null);
exports.BetaController = BetaController = __decorate([
    (0, common_1.Controller)('beta'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [beta_service_1.BetaService])
], BetaController);
//# sourceMappingURL=beta.controller.js.map