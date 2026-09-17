"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FounderModule = void 0;
const common_1 = require("@nestjs/common");
const founder_controller_1 = require("./founder.controller");
const founder_guard_1 = require("./founder.guard");
const founder_service_1 = require("./founder.service");
const beta_module_1 = require("../beta/beta.module");
let FounderModule = class FounderModule {
};
exports.FounderModule = FounderModule;
exports.FounderModule = FounderModule = __decorate([
    (0, common_1.Module)({ imports: [beta_module_1.BetaModule], controllers: [founder_controller_1.FounderController], providers: [founder_guard_1.FounderGuard, founder_service_1.FounderService] })
], FounderModule);
//# sourceMappingURL=founder.module.js.map