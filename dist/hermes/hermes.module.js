"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesModule = void 0;
const common_1 = require("@nestjs/common");
const codex_integration_controller_1 = require("./codex-integration.controller");
const hermes_control_controller_1 = require("./hermes-control.controller");
const n8n_callback_controller_1 = require("./n8n-callback.controller");
const n8n_hermes_controller_1 = require("./n8n-hermes.controller");
const hermes_task_service_1 = require("./hermes-task.service");
const hermes_control_service_1 = require("./hermes-control.service");
const n8n_callback_service_1 = require("./n8n-callback.service");
const hermes_builder_executor_service_1 = require("./hermes-builder-executor.service");
const hermes_builder_result_recorder_service_1 = require("./hermes-builder-result-recorder.service");
const hermes_system_service_1 = require("./hermes-system.service");
let HermesModule = class HermesModule {
};
exports.HermesModule = HermesModule;
exports.HermesModule = HermesModule = __decorate([
    (0, common_1.Module)({
        controllers: [codex_integration_controller_1.CodexIntegrationController, hermes_control_controller_1.HermesControlController, n8n_callback_controller_1.N8nCallbackController, n8n_hermes_controller_1.N8nHermesController],
        providers: [
            hermes_task_service_1.HermesTaskService,
            hermes_control_service_1.HermesControlService,
            n8n_callback_service_1.N8nCallbackService,
            hermes_builder_executor_service_1.HermesBuilderExecutor,
            hermes_builder_result_recorder_service_1.HermesBuilderResultRecorder,
            hermes_system_service_1.HermesSystemService
        ],
        exports: [hermes_task_service_1.HermesTaskService, hermes_control_service_1.HermesControlService, hermes_builder_executor_service_1.HermesBuilderExecutor]
    })
], HermesModule);
//# sourceMappingURL=hermes.module.js.map