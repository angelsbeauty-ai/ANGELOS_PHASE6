import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuthModule } from './auth/auth.module';
import { AutomationsModule } from './automations/automations.module';
import { BetaModule } from './beta/beta.module';
import { BookingsModule } from './bookings/bookings.module';
import { ClientsModule } from './clients/clients.module';
import { ContentModule } from './content/content.module';
import { DbModule } from './db/db.module';
import { FinanceModule } from './finance/finance.module';
import { FounderModule } from './founder/founder.module';
import { HealthModule } from './health/health.module';
import { HermesModule } from './hermes/hermes.module';
import { MediaModule } from './media/media.module';
import { MessagingModule } from './messaging/messaging.module';
import { ProductAnalyticsModule } from './product-analytics/product-analytics.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SystemHealthModule } from './system-health/system-health.module';
import { VoiceModule } from './voice/voice.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    WorkspacesModule,
    AiModule,
    AnalyticsModule,
    ApprovalsModule,
    AutomationsModule,
    BetaModule,
    BookingsModule,
    ClientsModule,
    ContentModule,
    FinanceModule,
    FounderModule,
    HealthModule,
    HermesModule,
    MediaModule,
    MessagingModule,
    ProductAnalyticsModule,
    SubscriptionsModule,
    SystemHealthModule,
    VoiceModule,
  ],
})
export class AppModule {}
