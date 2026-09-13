import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [AutomationsModule],
  controllers: [ClientsController],
  providers: [ClientsService, SupabaseAuthGuard],
})
export class ClientsModule {}
