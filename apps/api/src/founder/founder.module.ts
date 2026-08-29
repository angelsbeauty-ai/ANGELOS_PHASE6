import { Module } from '@nestjs/common';
import { FounderController } from './founder.controller';
import { FounderGuard } from './founder.guard';
import { FounderService } from './founder.service';
import { BetaModule } from '../beta/beta.module';
@Module({ imports: [BetaModule], controllers: [FounderController], providers: [FounderGuard, FounderService] })
export class FounderModule {}
