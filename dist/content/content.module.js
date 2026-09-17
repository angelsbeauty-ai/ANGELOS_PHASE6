"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModule = void 0;
const common_1 = require("@nestjs/common");
const content_controller_1 = require("./content.controller");
const content_service_1 = require("./content.service");
const publishing_service_1 = require("./publishing.service");
const publishing_adapter_registry_1 = require("./publishing-adapter.registry");
const ai_provider_service_1 = require("../ai/ai-provider.service");
let ContentModule = class ContentModule {
};
exports.ContentModule = ContentModule;
exports.ContentModule = ContentModule = __decorate([
    (0, common_1.Module)({
        controllers: [content_controller_1.ContentController],
        providers: [content_service_1.ContentService, publishing_service_1.PublishingService, publishing_adapter_registry_1.PublishingAdapterRegistry, ai_provider_service_1.AiProviderService],
        exports: [content_service_1.ContentService, publishing_service_1.PublishingService, publishing_adapter_registry_1.PublishingAdapterRegistry],
    })
], ContentModule);
//# sourceMappingURL=content.module.js.map