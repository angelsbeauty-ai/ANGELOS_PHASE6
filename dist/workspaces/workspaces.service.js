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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const beta_service_1 = require("../beta/beta.service");
let WorkspacesService = exports.WorkspacesService = class WorkspacesService {
    beta;
    constructor(beta) {
        this.beta = beta;
    }
    async create(user, dto) {
        await this.beta.ensureCanCreateWorkspace(user);
        const existing = await this.list(user);
        if (existing.length)
            throw new common_1.ConflictException('AngelOS V1 supports one main business workspace per account. Multi-business switching is planned for a later version.');
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.rpc('create_workspace_with_owner', {
            p_name: dto.name,
            p_business_type: dto.businessType ?? null,
            p_timezone: dto.timezone,
            p_currency: dto.currency,
            p_locale: dto.locale
        });
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async list(user) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase
            .from('workspace_memberships')
            .select('workspace:workspaces(id,name,business_type,timezone,currency,locale)')
            .eq('user_id', user.id);
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data?.map((row) => row.workspace).filter(Boolean) ?? [];
    }
};
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [beta_service_1.BetaService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map