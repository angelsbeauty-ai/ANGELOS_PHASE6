import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SubscriptionAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
