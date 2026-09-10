import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AiModule } from './ai/ai.module';
import { ClientsModule } from './clients/clients.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagingModule } from './messaging/messaging.module';
import { MediaModule } from './media/media.module';
import { ContentModule } from './content/content.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FinanceModule } from './finance/finance.module';
import { AutomationsModule } from './automations/automations.module';
import { SystemHealthModule } from './system-health/system-health.module';
import { EmergencyReadOnlyGuard } from './common/guards/emergency-read-only.guard';
import { SubscriptionAccessGuard } from './common/guards/subscription-access.guard';
import { PlatformFeatureGuard } from './common/guards/platform-feature.guard';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FounderModule } from './founder/founder.module';
import { ProductAnalyticsModule } from './product-analytics/product-analytics.module';
import { BetaModule } from './beta/beta.module';
import { BetaAccessGuard } from './common/guards/beta-access.guard';
import { HermesModule } from './hermes/hermes.module';

@Module({
  imports: [HealthModule, WorkspacesModule, AiModule, ClientsModule, BookingsModule, MessagingModule, MediaModule, ContentModule, AnalyticsModule, FinanceModule, AutomationsModule, SystemHealthModule, SubscriptionsModule, FounderModule, ProductAnalyticsModule, BetaModule, HermesModule],
  providers: [
    { provide: APP_GUARD, useClass: EmergencyReadOnlyGuard },
    { provide: APP_GUARD, useClass: SubscriptionAccessGuard },
    { provide: APP_GUARD, useClass: PlatformFeatureGuard },
    { provide: APP_GUARD, useClass: BetaAccessGuard }
  ]
})
export class AppModule {}
