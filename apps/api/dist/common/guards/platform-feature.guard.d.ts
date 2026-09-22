import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class PlatformFeatureGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
    private featureFor;
}
