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
exports.MessagingController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const messaging_service_1 = require("./messaging.service");
const create_demo_channel_dto_1 = require("./dto/create-demo-channel.dto");
const ingest_message_dto_1 = require("./dto/ingest-message.dto");
const create_reply_dto_1 = require("./dto/create-reply.dto");
const update_thread_dto_1 = require("./dto/update-thread.dto");
const internal_note_dto_1 = require("./dto/internal-note.dto");
const translate_message_dto_1 = require("./dto/translate-message.dto");
const review_client_control_draft_dto_1 = require("./dto/review-client-control-draft.dto");
const connect_meta_channel_dto_1 = require("./dto/connect-meta-channel.dto");
const connect_line_channel_dto_1 = require("./dto/connect-line-channel.dto");
let MessagingController = class MessagingController {
    messaging;
    constructor(messaging) {
        this.messaging = messaging;
    }
    listChannels(user, workspaceId) { return this.messaging.listChannels(user, workspaceId); }
    createDemoChannel(user, workspaceId, dto) { return this.messaging.createDemoChannel(user, workspaceId, dto); }
    getClientControlReviewQueue(user, workspaceId) { return this.messaging.getClientControlReviewQueue(user, workspaceId); }
    getClientControlReviewDetail(user, workspaceId, messageId) { return this.messaging.getClientControlReviewDetail(user, workspaceId, messageId); }
    reviewClientControlDraft(user, workspaceId, messageId, dto) { return this.messaging.reviewClientControlDraft(user, workspaceId, messageId, dto); }
    connectMetaChannel(user, workspaceId, dto) { return this.messaging.connectMetaChannel(user, workspaceId, dto); }
    disconnectMetaChannel(user, workspaceId, provider) { return this.messaging.disconnectMetaChannel(user, workspaceId, provider); }
    getMetaStatus(user, workspaceId) { return this.messaging.getMetaSetupStatus(user, workspaceId); }
    connectLineChannel(user, workspaceId, dto) { return this.messaging.connectLineChannel(user, workspaceId, dto); }
    disconnectLineChannel(user, workspaceId) { return this.messaging.disconnectLineChannel(user, workspaceId); }
    getLineStatus(user, workspaceId) { return this.messaging.getLineSetupStatus(user, workspaceId); }
    listThreads(user, workspaceId) { return this.messaging.listThreads(user, workspaceId); }
    stageClientControlDraft(user, workspaceId, threadId) { return this.messaging.stageClientControlDraft(user, workspaceId, threadId); }
    getClientControlContext(user, workspaceId, threadId) { return this.messaging.getClientControlContext(user, workspaceId, threadId); }
    getThread(user, workspaceId, threadId) { return this.messaging.getThread(user, workspaceId, threadId); }
    ingestDemo(user, workspaceId, dto) { return this.messaging.ingestDemoMessage(user, workspaceId, dto); }
    draftReply(user, workspaceId, threadId) { return this.messaging.draftReply(user, workspaceId, threadId); }
    createReply(user, workspaceId, threadId, dto) { return this.messaging.createReply(user, workspaceId, threadId, dto); }
    translateMessage(user, workspaceId, messageId, dto) { return this.messaging.translateMessage(user, workspaceId, messageId, dto.targetLanguage); }
    approveAndSend(user, workspaceId, messageId) { return this.messaging.approveAndSend(user, workspaceId, messageId); }
    addInternalNote(user, workspaceId, threadId, dto) { return this.messaging.addInternalNote(user, workspaceId, threadId, dto.content); }
    updateThread(user, workspaceId, threadId, dto) { return this.messaging.updateThread(user, workspaceId, threadId, dto); }
};
exports.MessagingController = MessagingController;
__decorate([
    (0, common_1.Get)('channels'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "listChannels", null);
__decorate([
    (0, common_1.Post)('channels/demo'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_demo_channel_dto_1.CreateDemoChannelDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "createDemoChannel", null);
__decorate([
    (0, common_1.Get)('client-control/review-queue'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getClientControlReviewQueue", null);
__decorate([
    (0, common_1.Get)('client-control/drafts/:messageId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getClientControlReviewDetail", null);
__decorate([
    (0, common_1.Post)('client-control/drafts/:messageId/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, review_client_control_draft_dto_1.ReviewClientControlDraftDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "reviewClientControlDraft", null);
__decorate([
    (0, common_1.Post)('channels/meta'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, connect_meta_channel_dto_1.ConnectMetaChannelDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "connectMetaChannel", null);
__decorate([
    (0, common_1.Post)('channels/meta/:provider/disconnect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "disconnectMetaChannel", null);
__decorate([
    (0, common_1.Get)('meta/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getMetaStatus", null);
__decorate([
    (0, common_1.Post)('channels/line'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, connect_line_channel_dto_1.ConnectLineChannelDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "connectLineChannel", null);
__decorate([
    (0, common_1.Post)('channels/line/disconnect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "disconnectLineChannel", null);
__decorate([
    (0, common_1.Get)('line/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getLineStatus", null);
__decorate([
    (0, common_1.Get)('threads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "listThreads", null);
__decorate([
    (0, common_1.Post)('threads/:threadId/client-control/stage-draft'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "stageClientControlDraft", null);
__decorate([
    (0, common_1.Get)('threads/:threadId/client-control-context'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getClientControlContext", null);
__decorate([
    (0, common_1.Get)('threads/:threadId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getThread", null);
__decorate([
    (0, common_1.Post)('ingest-demo'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ingest_message_dto_1.IngestMessageDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "ingestDemo", null);
__decorate([
    (0, common_1.Post)('threads/:threadId/ai-draft'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "draftReply", null);
__decorate([
    (0, common_1.Post)('threads/:threadId/replies'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_reply_dto_1.CreateReplyDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "createReply", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/translate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, translate_message_dto_1.TranslateMessageDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "translateMessage", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/approve-send'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "approveAndSend", null);
__decorate([
    (0, common_1.Post)('threads/:threadId/internal-notes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, internal_note_dto_1.InternalNoteDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "addInternalNote", null);
__decorate([
    (0, common_1.Patch)('threads/:threadId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('threadId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_thread_dto_1.UpdateThreadDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "updateThread", null);
exports.MessagingController = MessagingController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/messaging'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], MessagingController);
//# sourceMappingURL=messaging.controller.js.map