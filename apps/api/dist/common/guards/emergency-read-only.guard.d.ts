import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class EmergencyReadOnlyGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
