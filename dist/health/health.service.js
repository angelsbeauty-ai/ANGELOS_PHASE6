"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
let HealthService = exports.HealthService = class HealthService {
    liveness() {
        return {
            status: 'healthy',
            service: 'angelos-api',
            environment: process.env.NODE_ENV ?? 'development',
            release: process.env.RELEASE_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
            deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
            timestamp: new Date().toISOString(),
        };
    }
    async readiness() {
        return {
            status: 'ready',
            service: 'angelos-api',
            checks: { database: 'ready' },
            latencyMs: 0,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)()
], HealthService);
//# sourceMappingURL=health.service.js.map