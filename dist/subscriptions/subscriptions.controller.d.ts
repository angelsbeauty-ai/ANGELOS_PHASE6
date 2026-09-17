import type { AuthUser } from '../auth/auth-user';
import { ChangePlanDto } from './dto/change-plan.dto';
import { RedeemStudentDiscountDto } from './dto/redeem-student-discount.dto';
import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptions;
    constructor(subscriptions: SubscriptionsService);
    status(user: AuthUser, workspaceId: string): Promise<{
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
    checkout(user: AuthUser, workspaceId: string, dto: ChangePlanDto): Promise<{
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
    reactivateDemo(user: AuthUser, workspaceId: string, dto: ChangePlanDto): Promise<any>;
    studentDiscount(user: AuthUser, workspaceId: string, dto: RedeemStudentDiscountDto): Promise<any>;
}
