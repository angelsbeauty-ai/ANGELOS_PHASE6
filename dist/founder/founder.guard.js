"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FounderGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let FounderGuard = class FounderGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('Founder access requires authentication.');
        const envFounders = String(process.env.FOUNDER_USER_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
        if (envFounders.includes(user.id))
            return true;
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data } = await service.from('platform_founders').select('user_id').eq('user_id', user.id).maybeSingle();
        if (!data)
            throw new common_1.ForbiddenException('Founder access required.');
        return true;
    }
};
exports.FounderGuard = FounderGuard;
exports.FounderGuard = FounderGuard = __decorate([
    (0, common_1.Injectable)()
], FounderGuard);
//# sourceMappingURL=founder.guard.js.map