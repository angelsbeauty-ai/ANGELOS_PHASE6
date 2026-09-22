import type { AuthUser } from '../auth/auth-user';
import { BookingsService } from './bookings.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateCalendarBlockDto } from './dto/create-block.dto';
import { AvailabilityDto } from './dto/availability.dto';
import { SetBusinessHoursDto } from './dto/set-business-hours.dto';
export declare class BookingsController {
    private readonly bookings;
    constructor(bookings: BookingsService);
    services(user: AuthUser, workspaceId: string): Promise<any[]>;
    createService(user: AuthUser, workspaceId: string, dto: CreateServiceDto): Promise<any>;
    calendar(user: AuthUser, workspaceId: string, start: string, end: string): Promise<{
        appointments: any[];
        blocks: any[];
    }>;
    businessHours(user: AuthUser, workspaceId: string): Promise<any[]>;
    setBusinessHours(user: AuthUser, workspaceId: string, dto: SetBusinessHoursDto): Promise<any[]>;
    createBlock(user: AuthUser, workspaceId: string, dto: CreateCalendarBlockDto): Promise<any>;
    availability(user: AuthUser, workspaceId: string, dto: AvailabilityDto): Promise<{
        service: any;
        slots: {
            startAt: string;
            endAt: string;
            status: "available" | "soft_conflict";
            softConflicts: unknown[];
        }[];
    }>;
    createAppointment(user: AuthUser, workspaceId: string, dto: CreateAppointmentDto): Promise<{
        appointment: any;
        softConflictsAccepted: never[];
        duplicatePrevented: boolean;
    } | {
        appointment: any;
        softConflictsAccepted: unknown[];
        duplicatePrevented?: undefined;
    }>;
    confirm(user: AuthUser, workspaceId: string, appointmentId: string): Promise<{
        appointment: any;
        automationJobs: any[];
        automationWarning?: undefined;
    } | {
        appointment: any;
        automationJobs: never[];
        automationWarning: string;
    }>;
    cancel(user: AuthUser, workspaceId: string, appointmentId: string): Promise<{
        appointment: any;
    }>;
    complete(user: AuthUser, workspaceId: string, appointmentId: string): Promise<{
        appointment: any;
        automationJobs: any[];
        automationWarning?: undefined;
    } | {
        appointment: any;
        automationJobs: never[];
        automationWarning: string;
    }>;
    reschedule(user: AuthUser, workspaceId: string, appointmentId: string, dto: RescheduleAppointmentDto): Promise<{
        appointment: any;
        softConflictsAccepted: never[];
        duplicatePrevented: boolean;
    } | {
        appointment: any;
        softConflictsAccepted: unknown[];
        duplicatePrevented?: undefined;
    }>;
}
