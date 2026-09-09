import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { MessagingController } from './messaging.controller';
import { MetaWebhookController } from './meta-webhook.controller';
import { MessagingService } from './messaging.service';
import { StagingMessageExecutionService } from './staging-message-execution.service';
import { LineMessagingAdapter } from './line-transport';

@Module({
  imports: [AiModule],
  controllers: [MessagingController, MetaWebhookController],
  providers: [MessagingService, StagingMessageExecutionService, SupabaseAuthGuard, LineMessagingAdapter],
  exports: [StagingMessageExecutionService]
})
export class MessagingModule {}
