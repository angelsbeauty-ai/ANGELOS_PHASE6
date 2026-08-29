import { Module } from '@nestjs/common';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';

@Module({ controllers: [SystemHealthController], providers: [SystemHealthService], exports: [SystemHealthService] })
export class SystemHealthModule {}
