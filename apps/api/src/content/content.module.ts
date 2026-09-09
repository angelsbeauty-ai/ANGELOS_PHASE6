import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { PublishingService } from './publishing.service';
import { PublishingAdapterRegistry } from './publishing-adapter.registry';
import { AiProviderService } from '../ai/ai-provider.service';

@Module({
  providers: [ContentService, PublishingService, PublishingAdapterRegistry, AiProviderService],
  exports: [ContentService, PublishingService, PublishingAdapterRegistry],
})
export class ContentModule {}
