import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateCalendarBlockDto } from './dto/create-block.dto';
import { AvailabilityDto } from './dto/availability.dto';
import { SetBusinessHoursDto } from './dto/set-business-hours.dto';

@Controller('workspaces/:workspaceId')
@UseGuards(SupabaseAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('services')
  services(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.bookings.listServices(user, workspaceId);
  }

  @Post('services')
  createService(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateServiceDto) {
    return this.bookings.createService(user, workspaceId, dto);
  }

  @Get('calendar')
  calendar(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('start') start: string, @Query('end') end: string) {
    return this.bookings.calendar(user, workspaceId, start, end);
  }

  @Get('business-hours')
  businessHours(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.bookings.getBusinessHours(user, workspaceId);
  }

  @Put('business-hours')
  setBusinessHours(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: SetBusinessHoursDto) {
    return this.bookings.setBusinessHours(user, workspaceId, dto);
  }

  @Post('calendar/blocks')
  createBlock(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateCalendarBlockDto) {
    return this.bookings.createBlock(user, workspaceId, dto);
  }

  @Post('availability')
  availability(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: AvailabilityDto) {
    return this.bookings.availability(user, workspaceId, dto);
  }

  @Post('appointments')
  createAppointment(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateAppointmentDto) {
    return this.bookings.createAppointment(user, workspaceId, dto);
  }

  @Post('appointments/:appointmentId/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('appointmentId') appointmentId: string) {
    return this.bookings.confirm(user, workspaceId, appointmentId);
  }

  @Post('appointments/:appointmentId/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('appointmentId') appointmentId: string) {
    return this.bookings.cancel(user, workspaceId, appointmentId);
  }

  @Post('appointments/:appointmentId/complete')
  complete(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('appointmentId') appointmentId: string) {
    return this.bookings.complete(user, workspaceId, appointmentId);
  }

  @Post('appointments/:appointmentId/reschedule')
  reschedule(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('appointmentId') appointmentId: string, @Body() dto: RescheduleAppointmentDto) {
    return this.bookings.reschedule(user, workspaceId, appointmentId, dto);
  }
}
