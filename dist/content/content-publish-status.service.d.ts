import { AuthUser } from '../auth/auth-user';
export interface ContentPublishStatus {
    workspaceId: string;
    totalPosts: number;
    pendingApproval: number;
    approved: number;
    scheduled: number;
    publishing: number;
    published: number;
    failed: number;
    posts: ContentPostSummary[];
}
export interface ContentPostSummary {
    id: string;
    title: string;
    status: string;
    objective: string;
    createdAt: string;
    approvedAt?: string;
    scheduledFor?: string;
    publishedAt?: string;
    variants: VariantSummary[];
}
export interface VariantSummary {
    id: string;
    platform: string;
    status: string;
    caption?: string;
    scheduledFor?: string;
    publishedAt?: string;
    providerPostId?: string;
}
export declare class ContentPublishStatusService {
    getPublishStatus(user: AuthUser, workspaceId: string): Promise<{
        totalPosts: number;
        pendingApproval: number;
        approved: number;
        scheduled: number;
        publishing: number;
        published: number;
        failed: number;
        workspaceId: string;
        posts: {
            id: any;
            title: any;
            status: any;
            objective: any;
            createdAt: any;
            approvedAt: any;
            scheduledFor: any;
            publishedAt: any;
            variants: any;
        }[];
    }>;
}
