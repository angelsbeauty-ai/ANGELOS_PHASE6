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
exports.N8nHermesController = void 0;
const common_1 = require("@nestjs/common");
const hermes_system_service_1 = require("./hermes-system.service");
const hermes_control_service_1 = require("./hermes-control.service");
const hermes_builder_executor_service_1 = require("./hermes-builder-executor.service");
const n8nsecret_guard_1 = require("../common/guards/n8nsecret.guard");
let N8nHermesController = class N8nHermesController {
    systemTaskService;
    controlService;
    builderExecutor;
    constructor(systemTaskService, controlService, builderExecutor) {
        this.systemTaskService = systemTaskService;
        this.controlService = controlService;
        this.builderExecutor = builderExecutor;
    }
    async createTask(workspaceIdParam, body) {
        const workspaceId = workspaceIdParam || 'default';
        return this.systemTaskService.createAsSystem(workspaceId, body, body.n8n_execution_id);
    }
    async overviewPost(body) {
        const workspaceId = body?.workspaceId ?? 'default';
        return this.controlService.getOverviewAsSystem(workspaceId);
    }
    async overviewGet(workspaceIdQuery, workspaceIdParam) {
        const workspaceId = workspaceIdQuery ?? workspaceIdParam ?? 'default';
        return this.controlService.getOverviewAsSystem(workspaceId);
    }
    async execute(body) {
        return this.builderExecutor.execute(body);
    }
};
exports.N8nHermesController = N8nHermesController;
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], N8nHermesController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)('overview'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nHermesController.prototype, "overviewPost", null);
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], N8nHermesController.prototype, "overviewGet", null);
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nHermesController.prototype, "execute", null);
exports.N8nHermesController = N8nHermesController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/hermes/n8n'),
    (0, common_1.UseGuards)(n8nsecret_guard_1.N8nSecretGuard),
    __metadata("design:paramtypes", [hermes_system_service_1.HermesSystemService,
        hermes_control_service_1.HermesControlService,
        hermes_builder_executor_service_1.HermesBuilderExecutor])
], N8nHermesController);
//# sourceMappingURL=n8n-hermes.controller.js.map