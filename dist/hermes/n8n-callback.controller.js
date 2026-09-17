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
exports.N8nCallbackController = void 0;
const common_1 = require("@nestjs/common");
const hermes_builder_result_recorder_service_1 = require("./hermes-builder-result-recorder.service");
const n8nsecret_guard_1 = require("../common/guards/n8nsecret.guard");
let N8nCallbackController = class N8nCallbackController {
    recorder;
    constructor(recorder) {
        this.recorder = recorder;
    }
    async callback(body) {
        return this.recorder.recordResult(body.taskId, body.executionId ?? 'n8n-' + Date.now(), body.result ?? {}, body.error);
    }
};
exports.N8nCallbackController = N8nCallbackController;
__decorate([
    (0, common_1.Post)('callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nCallbackController.prototype, "callback", null);
exports.N8nCallbackController = N8nCallbackController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/hermes/n8n'),
    (0, common_1.UseGuards)(n8nsecret_guard_1.N8nSecretGuard),
    __metadata("design:paramtypes", [hermes_builder_result_recorder_service_1.HermesBuilderResultRecorder])
], N8nCallbackController);
//# sourceMappingURL=n8n-callback.controller.js.map