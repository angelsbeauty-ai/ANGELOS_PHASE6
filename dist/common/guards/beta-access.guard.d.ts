import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class BetaAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
