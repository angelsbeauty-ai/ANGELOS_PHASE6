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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const ai_service_1 = require("./ai.service");
const create_conversation_dto_1 = require("./dto/create-conversation.dto");
const create_memory_dto_1 = require("./dto/create-memory.dto");
const send_ai_message_dto_1 = require("./dto/send-ai-message.dto");
const send_voice_message_dto_1 = require("./dto/send-voice-message.dto");
const update_assistant_profile_dto_1 = require("./dto/update-assistant-profile.dto");
const update_assistant_roles_dto_1 = require("./dto/update-assistant-roles.dto");
let AiController = class AiController {
    ai;
    constructor(ai) {
        this.ai = ai;
    }
    getProfile(user, workspaceId) {
        return this.ai.getProfile(user, workspaceId);
    }
    updateProfile(user, workspaceId, dto) {
        return this.ai.updateProfile(user, workspaceId, dto);
    }
    updateRoles(user, workspaceId, dto) {
        return this.ai.updateRoles(user, workspaceId, dto);
    }
    createConversation(user, workspaceId, dto) {
        return this.ai.createConversation(user, workspaceId, dto);
    }
    listMessages(user, workspaceId, conversationId) {
        return this.ai.listMessages(user, workspaceId, conversationId);
    }
    sendMessage(user, workspaceId, conversationId, dto) {
        return this.ai.sendMessage(user, workspaceId, conversationId, dto);
    }
    proposeMemory(user, workspaceId, dto) {
        return this.ai.proposeMemory(user, workspaceId, dto);
    }
    listMemory(user, workspaceId) {
        return this.ai.listMemory(user, workspaceId);
    }
    approveAction(user, workspaceId, actionId) {
        return this.ai.approveAction(user, workspaceId, actionId);
    }
    cancelAction(user, workspaceId, actionId) {
        return this.ai.cancelAction(user, workspaceId, actionId);
    }
    sendVoice(user, workspaceId, dto) {
        return this.ai.sendVoice(user, workspaceId, dto);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_assistant_profile_dto_1.UpdateAssistantProfileDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('roles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_assistant_roles_dto_1.UpdateAssistantRolesDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "updateRoles", null);
__decorate([
    (0, common_1.Post)('conversations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_conversation_dto_1.CreateConversationDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId/messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('conversationId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, send_ai_message_dto_1.SendAiMessageDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('memory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_memory_dto_1.CreateMemoryDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "proposeMemory", null);
__decorate([
    (0, common_1.Get)('memory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "listMemory", null);
__decorate([
    (0, common_1.Post)('actions/:actionId/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('actionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "approveAction", null);
__decorate([
    (0, common_1.Post)('actions/:actionId/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('actionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "cancelAction", null);
__decorate([
    (0, common_1.Post)('voice'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_voice_message_dto_1.SendVoiceMessageDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "sendVoice", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/ai'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map