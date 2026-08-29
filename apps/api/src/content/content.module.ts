import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [AiModule],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule {}
