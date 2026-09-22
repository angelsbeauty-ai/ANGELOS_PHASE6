"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nSecretGuard = void 0;
const common_1 = require("@nestjs/common");
let N8nSecretGuard = exports.N8nSecretGuard = class N8nSecretGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const headerSecret = request.headers['x-n8n-secret'];
        const envSecret = process.env.N8N_HERMES_SECRET;
        if (!envSecret) {
            throw new common_1.UnauthorizedException('N8N_HERMES_SECRET not configured');
        }
        if (!headerSecret || headerSecret !== envSecret) {
            throw new common_1.UnauthorizedException('Invalid n8n secret');
        }
        return true;
    }
};
exports.N8nSecretGuard = N8nSecretGuard = __decorate([
    (0, common_1.Injectable)()
], N8nSecretGuard);
//# sourceMappingURL=n8nsecret.guard.js.map