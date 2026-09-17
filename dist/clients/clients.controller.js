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
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const clients_service_1 = require("./clients.service");
const create_client_dto_1 = require("./dto/create-client.dto");
const update_client_dto_1 = require("./dto/update-client.dto");
const create_note_dto_1 = require("./dto/create-note.dto");
const create_treatment_dto_1 = require("./dto/create-treatment.dto");
const create_consent_dto_1 = require("./dto/create-consent.dto");
const create_followup_dto_1 = require("./dto/create-followup.dto");
const automations_service_1 = require("../automations/automations.service");
let ClientsController = exports.ClientsController = class ClientsController {
    clients;
    automations;
    constructor(clients, automations) {
        this.clients = clients;
        this.automations = automations;
    }
    list(user, workspaceId, search) {
        return this.clients.list(user, workspaceId, search);
    }
    create(user, workspaceId, dto) {
        return this.clients.create(user, workspaceId, dto);
    }
    get(user, workspaceId, clientId) {
        return this.clients.get(user, workspaceId, clientId);
    }
    update(user, workspaceId, clientId, dto) {
        return this.clients.update(user, workspaceId, clientId, dto);
    }
    addNote(user, workspaceId, clientId, dto) {
        return this.clients.addNote(user, workspaceId, clientId, dto);
    }
    addTreatment(user, workspaceId, clientId, dto) {
        return this.clients.addTreatment(user, workspaceId, clientId, dto);
    }
    addConsent(user, workspaceId, clientId, dto) {
        return this.clients.addConsent(user, workspaceId, clientId, dto);
    }
    addFollowup(user, workspaceId, clientId, dto) {
        return this.clients.addFollowup(user, workspaceId, clientId, dto);
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_client_dto_1.CreateClientDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':clientId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':clientId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_client_dto_1.UpdateClientDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':clientId/notes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_note_dto_1.CreateClientNoteDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "addNote", null);
__decorate([
    (0, common_1.Post)(':clientId/treatments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_treatment_dto_1.CreateTreatmentDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "addTreatment", null);
__decorate([
    (0, common_1.Post)(':clientId/consents'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_consent_dto_1.CreateConsentDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "addConsent", null);
__decorate([
    (0, common_1.Post)(':clientId/followups'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('clientId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_followup_dto_1.CreateFollowupDto]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "addFollowup", null);
exports.ClientsController = ClientsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId/clients'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [clients_service_1.ClientsService, automations_service_1.AutomationsService])
], ClientsController);
//# sourceMappingURL=clients.controller.js.map