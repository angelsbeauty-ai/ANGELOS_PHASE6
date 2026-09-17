"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPublishStatusService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let ContentPublishStatusService = class ContentPublishStatusService {
    async getPublishStatus(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: posts, error } = await supabase
            .from('content_posts')
            .select('*,variants:content_variants(*)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        const postList = (posts ?? []).map((p) => {
            const variants = (p.variants ?? []).map((v) => ({
                id: v.id,
                platform: v.platform,
                status: v.status,
                caption: v.caption ?? undefined,
                scheduledFor: v.scheduled_for ?? undefined,
                publishedAt: v.published_at ?? undefined,
                providerPostId: v.provider_post_id ?? undefined
            }));
            return {
                id: p.id,
                title: p.title,
                status: p.status,
                objective: p.objective,
                createdAt: p.created_at,
                approvedAt: p.approved_at ?? undefined,
                scheduledFor: p.scheduled_for ?? undefined,
                publishedAt: p.published_at ?? undefined,
                variants
            };
        });
        const counts = {
            totalPosts: postList.length,
            pendingApproval: postList.filter(p => p.status === 'prepared').length,
            approved: postList.filter(p => p.status === 'approved').length,
            scheduled: postList.filter(p => p.status === 'scheduled').length,
            publishing: postList.filter(p => p.status === 'publishing').length,
            published: postList.filter(p => p.status === 'published').length,
            failed: postList.filter(p => p.status === 'failed').length
        };
        return { workspaceId, posts: postList, ...counts };
    }
};
exports.ContentPublishStatusService = ContentPublishStatusService;
exports.ContentPublishStatusService = ContentPublishStatusService = __decorate([
    (0, common_1.Injectable)()
], ContentPublishStatusService);
//# sourceMappingURL=content-publish-status.service.js.map