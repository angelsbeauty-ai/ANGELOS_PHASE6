import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AiController } from './ai.controller';
import { AiProviderService } from './ai-provider.service';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AiProviderService, SupabaseAuthGuard],
  exports: [AiProviderService]
})
export class AiModule {}
