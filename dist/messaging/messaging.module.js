"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const ai_module_1 = require("../ai/ai.module");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const messaging_controller_1 = require("./messaging.controller");
const meta_webhook_controller_1 = require("./meta-webhook.controller");
const messaging_service_1 = require("./messaging.service");
const staging_message_execution_service_1 = require("./staging-message-execution.service");
const line_transport_1 = require("./line-transport");
let MessagingModule = exports.MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule],
        controllers: [messaging_controller_1.MessagingController, meta_webhook_controller_1.MetaWebhookController],
        providers: [messaging_service_1.MessagingService, staging_message_execution_service_1.StagingMessageExecutionService, supabase_auth_guard_1.SupabaseAuthGuard, line_transport_1.LineMessagingAdapter],
        exports: [staging_message_execution_service_1.StagingMessageExecutionService]
    })
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map