import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { HermesControlController } from './hermes-control.controller';
import { N8nCallbackController } from './n8n-callback.controller';
import { N8nHermesController } from './n8n-hermes.controller';
import { HermesTaskService } from './hermes-task.service';
import { HermesControlService } from './hermes-control.service';
import { N8nCallbackService } from './n8n-callback.service';
import { HermesBuilderExecutor } from './hermes-builder-executor.service';
import { HermesBuilderResultRecorder } from './hermes-builder-result-recorder.service';
import { HermesSystemService } from './hermes-system.service';
import { N8nHermesService } from './n8n-hermes.service';

@Module({
  imports: [AiModule],
  controllers: [HermesControlController, N8nCallbackController, N8nHermesController],
  providers: [
    HermesTaskService,
    HermesControlService,
    N8nCallbackService,
    HermesBuilderExecutor,
    HermesBuilderResultRecorder,
    HermesSystemService,
    N8nHermesService
  ],
  exports: [HermesTaskService, HermesControlService, HermesBuilderExecutor]
})
export class HermesModule {}
