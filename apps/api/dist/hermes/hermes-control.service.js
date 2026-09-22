"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesControlService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let HermesControlService = exports.HermesControlService = class HermesControlService {
    async getOverviewAsSystem(workspaceId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        return this.getOverviewFromSupabase(workspaceId, supabase);
    }
    async getOverviewFromSupabase(workspaceId, supabase) {
        const [approvalsResult, attentionResult] = await Promise.all([
            supabase
                .from('approvals')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false }),
            supabase
                .from('attention_items')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('status', 'open')
                .order('severity', { ascending: false })
        ]);
        const pendingApprovals = (approvalsResult.data ?? []).map((a) => ({
            id: a.id,
            type: a.type,
            status: a.status,
            sourceId: a.source_id,
            sourceChannel: a.source_channel,
            content: a.content,
            clientName: a.client_name,
            createdAt: a.created_at
        }));
        const attentionItems = (attentionResult.data ?? []).map((a) => ({
            id: a.id,
            severity: a.severity,
            title: a.title,
            summary: a.summary,
            status: a.status,
            managedBy: a.managed_by,
            createdAt: a.created_at
        }));
        return {
            workspaceId,
            pendingApprovals: pendingApprovals.length,
            needsAttention: attentionItems.length,
            pendingApprovalsItems: pendingApprovals,
            attentionItems
        };
    }
};
exports.HermesControlService = HermesControlService = __decorate([
    (0, common_1.Injectable)()
], HermesControlService);
//# sourceMappingURL=hermes-control.service.js.map