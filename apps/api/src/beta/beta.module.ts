import { Module } from '@nestjs/common';
import { BetaController } from './beta.controller';
import { BetaService } from './beta.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
@Module({ controllers: [BetaController], providers: [BetaService, SupabaseAuthGuard], exports: [BetaService] })
export class BetaModule {}
