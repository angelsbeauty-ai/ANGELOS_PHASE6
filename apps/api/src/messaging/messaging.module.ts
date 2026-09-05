import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { StagingMessageExecutionService } from './staging-message-execution.service';

@Module({
  imports: [AiModule],
  controllers: [MessagingController],
  providers: [MessagingService, StagingMessageExecutionService, SupabaseAuthGuard],
  exports: [StagingMessageExecutionService]
})
export class MessagingModule {}
