import type { AuthUser } from '../auth/auth-user';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import type { CreateCalendarBlockDto } from './dto/create-block.dto';
import type { AvailabilityDto } from './dto/availability.dto';
import type { SetBusinessHoursDto } from './dto/set-business-hours.dto';
import { AutomationsService } from '../automations/automations.service';
export declare class BookingsService {
    private readonly automations;
    constructor(automations: AutomationsService);
    listServices(user: AuthUser, workspaceId: string): Promise<any[]>;
    createService(user: AuthUser, workspaceId: string, dto: CreateServiceDto): Promise<any>;
    getBusinessHours(user: AuthUser, workspaceId: string): Promise<any[]>;
    setBusinessHours(user: AuthUser, workspaceId: string, dto: SetBusinessHoursDto): Promise<any[]>;
    createBlock(user: AuthUser, workspaceId: string, dto: CreateCalendarBlockDto): Promise<any>;
    calendar(user: AuthUser, workspaceId: string, windowStart: string, windowEnd: string): Promise<{
        appointments: any[];
        blocks: any[];
    }>;
    availability(user: AuthUser, workspaceId: string, dto: AvailabilityDto): Promise<{
        service: any;
        slots: {
            startAt: string;
            endAt: string;
            status: 'available' | 'soft_conflict';
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
    private findBookingRequest;
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
    private transition;
    private getService;
    private assertClient;
    private getWorkingHoursConflict;
    private getConflicts;
    private appendEvent;
}
