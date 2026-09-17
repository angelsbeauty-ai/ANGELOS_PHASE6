import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from '@nestjs/config';
import { DbrexecModule } from './db/dbrexec.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { HermesModule } from './hermes/hermes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbrexecModule,
    WorkspacesModule,
    HermesModule,
    AgentModule,
  ],
})
export class AppModule {}
