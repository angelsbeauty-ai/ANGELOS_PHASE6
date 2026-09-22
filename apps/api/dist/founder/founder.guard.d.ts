import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class FounderGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
