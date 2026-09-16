import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { HermesModule } from './hermes/hermes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    WorkspacesModule,
    HermesModule,
    AgentModule,
  ],
})
export class AppModule {}
