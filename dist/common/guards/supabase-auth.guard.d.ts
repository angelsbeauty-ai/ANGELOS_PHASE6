import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SupabaseAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
