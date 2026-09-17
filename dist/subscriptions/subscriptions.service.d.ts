import type { AuthUser } from '../auth/auth-user';
export declare class SubscriptionsService {
    private readonly billing;
    getStatus(user: AuthUser, workspaceId: string): Promise<{
        subscription: any;
        plan: any;
        pricing: {
            currency: any;
            billingInterval: "yearly" | "monthly";
            baseCents: any;
            discountPercent: number;
            finalCents: number;
        };
        access: {
            readEnabled: boolean;
            writeEnabled: boolean;
            aiEnabled: boolean;
            publishingEnabled: boolean;
            automationsEnabled: boolean;
            reason: string | null;
        };
        billingProvider: {
            name: string;
            configured: boolean;
        };
        policy: {
            readOnlyDaysAfterCancellation: number;
            studentDiscountPercent: number;
        };
    }>;
    selectPlan(user: AuthUser, workspaceId: string, billingInterval: 'monthly' | 'yearly'): Promise<{
        checkout: {
            mode: "checkout" | "not_configured";
            url?: string;
            message?: string;
        };
        preview: {
            currency: any;
            billingInterval: "yearly" | "monthly";
            baseCents: any;
            discountPercent: number;
            finalCents: number;
        };
    }>;
    cancel(user: AuthUser, workspaceId: string): Promise<any>;
    reactivateDemo(user: AuthUser, workspaceId: string, billingInterval: 'monthly' | 'yearly'): Promise<any>;
    redeemStudentDiscount(user: AuthUser, workspaceId: string, token: string): Promise<any>;
    normalizeSubscription(workspaceId: string): Promise<any>;
    private calculatePrice;
    private accessFor;
    private assertWorkspaceAccess;
    private logEvent;
}
