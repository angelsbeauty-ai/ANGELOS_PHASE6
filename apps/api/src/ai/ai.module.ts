import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AiController } from './ai.controller';
import { AiProviderService } from './ai-provider.service';
import { AiService } from './ai.service';
import { CreditsService } from './credits.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AiProviderService, CreditsService, SupabaseAuthGuard],
  exports: [AiProviderService, CreditsService]
})
export class AiModule {}
