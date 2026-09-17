"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingAdapterRegistry = void 0;
const common_1 = require("@nestjs/common");
const publishing_adapter_1 = require("./publishing-adapter");
let PublishingAdapterRegistry = exports.PublishingAdapterRegistry = class PublishingAdapterRegistry {
    adapters = new Map();
    onModuleInit() {
        this.adapters.set('manual', new publishing_adapter_1.ManualDemoPublishingAdapter());
    }
    register(platform, adapter) {
        this.adapters.set(platform, adapter);
    }
    resolve(platform) {
        return this.adapters.get(platform) ?? null;
    }
    has(platform) {
        return this.adapters.has(platform);
    }
    get livePlatforms() {
        return Array.from(this.adapters.keys()).filter(p => p !== 'manual');
    }
};
exports.PublishingAdapterRegistry = PublishingAdapterRegistry = __decorate([
    (0, common_1.Injectable)()
], PublishingAdapterRegistry);
//# sourceMappingURL=publishing-adapter.registry.js.map