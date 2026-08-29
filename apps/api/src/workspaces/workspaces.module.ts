import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { BetaModule } from '../beta/beta.module';

@Module({
  imports: [BetaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, SupabaseAuthGuard]
})
export class WorkspacesModule {}
