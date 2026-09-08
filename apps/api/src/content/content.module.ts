import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PublishingAdapterRegistry } from './publishing-adapter.registry';
import { MetaPublishingAdapter } from './meta-publishing-adapter';

@Module({
  imports: [AiModule],
  controllers: [ContentController],
  providers: [ContentService, PublishingAdapterRegistry, MetaPublishingAdapter],
  exports: [ContentService, PublishingAdapterRegistry]
})
export class ContentModule {}
