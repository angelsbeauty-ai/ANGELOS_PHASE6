import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({ imports: [AutomationsModule], controllers: [BookingsController], providers: [BookingsService, SupabaseAuthGuard] })
export class BookingsModule {}
