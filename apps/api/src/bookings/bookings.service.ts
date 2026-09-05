import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient } from '../config/supabase';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import type { CreateCalendarBlockDto } from './dto/create-block.dto';
import type { AvailabilityDto } from './dto/availability.dto';
import type { SetBusinessHoursDto } from './dto/set-business-hours.dto';
import { AutomationsService } from '../automations/automations.service';

const ACTIVE_APPOINTMENT_STATUSES = ['confirmation_pending','confirmed','arrival_info_sent','checked_in'];
const HARD_BLOCK_TYPES = new Set(['hard', 'personal']);

@Injectable()
export class BookingsService {
  constructor(private readonly automations: AutomationsService) {}

  async listServices(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('services').select('*').eq('workspace_id', workspaceId).eq('active', true).order('name');
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async createService(user: AuthUser, workspaceId: string, dto: CreateServiceDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('currency').eq('id', workspaceId).single();
    if (workspaceError || !workspace) throw new NotFoundException('Workspace not found');

    const { data, error } = await supabase.from('services').insert({
      workspace_id: workspaceId,
      name: dto.name.trim(),
      duration_minutes: dto.durationMinutes,
      buffer_before_minutes: dto.bufferBeforeMinutes ?? 0,
      buffer_after_minutes: dto.bufferAfterMinutes ?? 0,
      standard_price: dto.standardPrice ?? 0,
      currency: dto.currency ?? workspace.currency,
      active: dto.active ?? true,
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getBusinessHours(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('business_hours').select('*').eq('workspace_id', workspaceId).order('day_of_week');
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async setBusinessHours(user: AuthUser, workspaceId: string, dto: SetBusinessHoursDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const rows = dto.hours.map((hour) => ({
      workspace_id: workspaceId,
      day_of_week: hour.dayOfWeek,
      start_time: hour.isClosed ? null : hour.startTime ?? null,
      end_time: hour.isClosed ? null : hour.endTime ?? null,
      is_closed: hour.isClosed,
      updated_at: new Date().toISOString()
    }));
    const invalid = rows.find((row) => !row.is_closed && (!row.start_time || !row.end_time));
    if (invalid) throw new ConflictException('Open business hours require start and end times');
    const { error } = await supabase.from('business_hours').upsert(rows, { onConflict: 'workspace_id,day_of_week' });
    if (error) throw new InternalServerErrorException(error.message);
    return this.getBusinessHours(user, workspaceId);
  }

  async createBlock(user: AuthUser, workspaceId: string, dto: CreateCalendarBlockDto) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (!(start < end)) throw new ConflictException('Calendar block end must be after start');
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('calendar_blocks').insert({
      workspace_id: workspaceId,
      title: dto.title.trim(),
      block_type: dto.blockType,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      notes: dto.notes?.trim() || null,
      created_by: user.id
    }).select('*').single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async calendar(user: AuthUser, workspaceId: string, windowStart: string, windowEnd: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    if (!(start < end)) throw new ConflictException('Invalid calendar window');

    const [appointments, blocks] = await Promise.all([
      supabase
        .from('appointments')
        .select('*,client:clients(id,display_name)')
        .eq('workspace_id', workspaceId)
        .lt('start_at', end.toISOString())
        .gt('end_at', start.toISOString())
        .neq('status', 'cancelled')
        .order('start_at'),
      supabase
        .from('calendar_blocks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .lt('start_at', end.toISOString())
        .gt('end_at', start.toISOString())
        .order('start_at')
    ]);
    if (appointments.error) throw new InternalServerErrorException(appointments.error.message);
    if (blocks.error) throw new InternalServerErrorException(blocks.error.message);
    return { appointments: appointments.data ?? [], blocks: blocks.data ?? [] };
  }

  async availability(user: AuthUser, workspaceId: string, dto: AvailabilityDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const service = await this.getService(supabase, workspaceId, dto.serviceId);
    const windowStart = new Date(dto.windowStart);
    const windowEnd = new Date(dto.windowEnd);
    if (!(windowStart < windowEnd)) throw new ConflictException('Invalid availability window');
    const step = dto.stepMinutes ?? 30;

    const busyBefore = service.buffer_before_minutes * 60_000;
    const busyAfter = service.buffer_after_minutes * 60_000;
    const duration = service.duration_minutes * 60_000;
    const rangeStart = new Date(windowStart.getTime() - busyAfter);
    const rangeEnd = new Date(windowEnd.getTime() + duration + busyBefore);

    const [appointments, blocks, workspaceResult, hoursResult] = await Promise.all([
      supabase.from('appointments').select('id,busy_start_at,busy_end_at,status').eq('workspace_id', workspaceId).in('status', ACTIVE_APPOINTMENT_STATUSES).lt('busy_start_at', rangeEnd.toISOString()).gt('busy_end_at', rangeStart.toISOString()),
      supabase.from('calendar_blocks').select('id,title,block_type,start_at,end_at').eq('workspace_id', workspaceId).lt('start_at', rangeEnd.toISOString()).gt('end_at', rangeStart.toISOString()),
      supabase.from('workspaces').select('timezone').eq('id', workspaceId).single(),
      supabase.from('business_hours').select('*').eq('workspace_id', workspaceId)
    ]);
    if (appointments.error) throw new InternalServerErrorException(appointments.error.message);
    if (blocks.error) throw new InternalServerErrorException(blocks.error.message);
    if (workspaceResult.error || !workspaceResult.data) throw new NotFoundException('Workspace not found');
    if (hoursResult.error) throw new InternalServerErrorException(hoursResult.error.message);

    const hoursRows = hoursResult.data ?? [];
    const slots: Array<{ startAt: string; endAt: string; status: 'available' | 'soft_conflict'; softConflicts: unknown[] }> = [];
    for (let cursor = windowStart.getTime(); cursor + duration <= windowEnd.getTime(); cursor += step * 60_000) {
      const start = new Date(cursor);
      const end = new Date(cursor + duration);
      const busyStart = new Date(cursor - busyBefore);
      const busyEnd = new Date(cursor + duration + busyAfter);
      const appointmentConflict = (appointments.data ?? []).some((item: any) => overlaps(busyStart, busyEnd, new Date(item.busy_start_at), new Date(item.busy_end_at)));
      if (appointmentConflict) continue;
      const overlappingBlocks = (blocks.data ?? []).filter((item: any) => overlaps(busyStart, busyEnd, new Date(item.start_at), new Date(item.end_at)));
      if (overlappingBlocks.some((block: any) => HARD_BLOCK_TYPES.has(block.block_type))) continue;
      const softBlocks = overlappingBlocks.filter((block: any) => !HARD_BLOCK_TYPES.has(block.block_type));
      const hoursConflict = workingHoursConflictFromRows(start, end, workspaceResult.data.timezone, hoursRows as any[]);
      const softConflicts = hoursConflict ? [...softBlocks, hoursConflict] : softBlocks;
      slots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        status: softConflicts.length ? 'soft_conflict' : 'available',
        softConflicts
      });
    }
    return { service, slots };
  }

  async createAppointment(user: AuthUser, workspaceId: string, dto: CreateAppointmentDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    await this.assertClient(supabase, workspaceId, dto.clientId);
    const service = await this.getService(supabase, workspaceId, dto.serviceId);
    const times = appointmentTimes(service, dto.startAt);
    const conflicts = await this.getConflicts(supabase, workspaceId, times.busyStart, times.busyEnd);
    const hoursConflict = await this.getWorkingHoursConflict(supabase, workspaceId, times.start, times.end);
    if (hoursConflict) conflicts.soft.push(hoursConflict);
    if (conflicts.hard.length) throw new ConflictException({ code: 'HARD_CONFLICT', message: 'That time is unavailable.', conflicts: conflicts.hard });
    if (conflicts.soft.length && !dto.overrideSoftConflict) {
      throw new ConflictException({ code: 'SOFT_CONFLICT', message: 'This time has a flexible/conditional conflict. Owner decision required.', conflicts: conflicts.soft });
    }

    const insert = {
      workspace_id: workspaceId,
      client_id: dto.clientId,
      service_id: service.id,
      service_name: service.name,
      duration_minutes: service.duration_minutes,
      buffer_before_minutes: service.buffer_before_minutes,
      buffer_after_minutes: service.buffer_after_minutes,
      price_snapshot: service.standard_price,
      currency: service.currency,
      start_at: times.start.toISOString(),
      end_at: times.end.toISOString(),
      busy_start_at: times.busyStart.toISOString(),
      busy_end_at: times.busyEnd.toISOString(),
      status: 'confirmation_pending',
      source: dto.source?.trim() || null,
      notes: dto.notes?.trim() || null,
      created_by: user.id
    };

    const { data, error } = await supabase.from('appointments').insert(insert).select('*,client:clients(id,display_name)').single();
    if (error) {
      if ((error as any).code === '23P01') throw new ConflictException('That time was just booked. Please choose another slot.');
      throw new InternalServerErrorException(error.message);
    }
    await this.appendEvent(supabase, user.id, workspaceId, data.id, 'created', null, appointmentSnapshot(data));
    return { appointment: data, softConflictsAccepted: conflicts.soft };
  }

  async confirm(user: AuthUser, workspaceId: string, appointmentId: string) {
    const appointment = await this.transition(user, workspaceId, appointmentId, 'confirmed', 'confirmed', ['request', 'confirmation_pending']);
    try {
      const automationJobs = await this.automations.queueForAppointmentEvent(user, workspaceId, appointmentId, 'appointment_confirmed');
      return { appointment, automationJobs };
    } catch (error) {
      return { appointment, automationJobs: [], automationWarning: error instanceof Error ? error.message : 'Automation planning failed' };
    }
  }

  async cancel(user: AuthUser, workspaceId: string, appointmentId: string) {
    const appointment = await this.transition(user, workspaceId, appointmentId, 'cancelled', 'cancelled', ACTIVE_APPOINTMENT_STATUSES.concat('request'));
    await this.automations.cancelAppointmentJobs(user, workspaceId, appointmentId);
    return { appointment };
  }

  async complete(user: AuthUser, workspaceId: string, appointmentId: string) {
    const appointment = await this.transition(user, workspaceId, appointmentId, 'completed', 'completed', ['confirmed', 'arrival_info_sent', 'checked_in']);
    try {
      const automationJobs = await this.automations.queueForAppointmentEvent(user, workspaceId, appointmentId, 'appointment_completed');
      return { appointment, automationJobs };
    } catch (error) {
      return { appointment, automationJobs: [], automationWarning: error instanceof Error ? error.message : 'Automation planning failed' };
    }
  }

  async reschedule(user: AuthUser, workspaceId: string, appointmentId: string, dto: RescheduleAppointmentDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: current, error: currentError } = await supabase.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
    if (currentError || !current) throw new NotFoundException('Appointment not found');
    if (['cancelled','completed','no_show'].includes(current.status)) throw new ConflictException('This appointment can no longer be rescheduled');

    const service = {
      duration_minutes: current.duration_minutes,
      buffer_before_minutes: current.buffer_before_minutes,
      buffer_after_minutes: current.buffer_after_minutes
    };
    const times = appointmentTimes(service, dto.startAt);
    const conflicts = await this.getConflicts(supabase, workspaceId, times.busyStart, times.busyEnd, appointmentId);
    const hoursConflict = await this.getWorkingHoursConflict(supabase, workspaceId, times.start, times.end);
    if (hoursConflict) conflicts.soft.push(hoursConflict);
    if (conflicts.hard.length) throw new ConflictException({ code: 'HARD_CONFLICT', message: 'That time is unavailable.', conflicts: conflicts.hard });
    if (conflicts.soft.length && !dto.overrideSoftConflict) throw new ConflictException({ code: 'SOFT_CONFLICT', message: 'Owner decision required for this flexible conflict.', conflicts: conflicts.soft });

    const { data, error } = await supabase.from('appointments').update({
      start_at: times.start.toISOString(), end_at: times.end.toISOString(), busy_start_at: times.busyStart.toISOString(), busy_end_at: times.busyEnd.toISOString(), updated_at: new Date().toISOString()
    }).eq('workspace_id', workspaceId).eq('id', appointmentId).select('*,client:clients(id,display_name)').single();
    if (error) {
      if ((error as any).code === '23P01') throw new ConflictException('That time was just booked. Please choose another slot.');
      throw new InternalServerErrorException(error.message);
    }
    await this.appendEvent(supabase, user.id, workspaceId, appointmentId, 'rescheduled', appointmentSnapshot(current), appointmentSnapshot(data));
    return { appointment: data, softConflictsAccepted: conflicts.soft };
  }

  private async transition(
    user: AuthUser,
    workspaceId: string,
    appointmentId: string,
    status: string,
    eventType: string,
    allowedFrom: string[]
  ) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: current, error: currentError } = await supabase.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
    if (currentError || !current) throw new NotFoundException('Appointment not found');
    // Constrain the update to the statuses this transition may legally start from. Without it a
    // cancelled or completed appointment could be moved back to confirmed -- and because
    // cancel() has already cancelled its automation jobs by then, the resurrected appointment
    // would silently lose its reminders. Doing it in the WHERE clause rather than as a read-then-
    // write also means a double tap only ever transitions once.
    const { data, error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', appointmentId)
      .in('status', allowedFrom)
      .select('*,client:clients(id,display_name)')
      .maybeSingle();
    if (error) {
      if ((error as any).code === '23P01') throw new ConflictException('That time was just booked. Please choose another slot.');
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new ConflictException(`This appointment is ${String(current.status).replaceAll('_', ' ')} and can no longer be marked ${status}.`);
    }
    await this.appendEvent(supabase, user.id, workspaceId, appointmentId, eventType, appointmentSnapshot(current), appointmentSnapshot(data));
    return data;
  }

  private async getService(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string, serviceId: string) {
    const { data, error } = await supabase.from('services').select('*').eq('workspace_id', workspaceId).eq('id', serviceId).eq('active', true).single();
    if (error || !data) throw new NotFoundException('Service not found');
    return data;
  }

  private async assertClient(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string, clientId: string) {
    const { data, error } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', clientId).single();
    if (error || !data) throw new NotFoundException('Client not found');
  }

  private async getWorkingHoursConflict(
    supabase: ReturnType<typeof createUserSupabaseClient>,
    workspaceId: string,
    start: Date,
    end: Date
  ) {
    const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('timezone').eq('id', workspaceId).single();
    if (workspaceError || !workspace) throw new NotFoundException('Workspace not found');
    const { data: hours, error } = await supabase.from('business_hours').select('*').eq('workspace_id', workspaceId);
    if (error) throw new InternalServerErrorException(error.message);
    return workingHoursConflictFromRows(start, end, workspace.timezone, hours ?? []);
  }

  private async getConflicts(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string, busyStart: Date, busyEnd: Date, excludeAppointmentId?: string) {
    let appointmentQuery = supabase.from('appointments').select('id,start_at,end_at,status').eq('workspace_id', workspaceId).in('status', ACTIVE_APPOINTMENT_STATUSES).lt('busy_start_at', busyEnd.toISOString()).gt('busy_end_at', busyStart.toISOString());
    if (excludeAppointmentId) appointmentQuery = appointmentQuery.neq('id', excludeAppointmentId);
    const [appointments, blocks] = await Promise.all([
      appointmentQuery,
      supabase.from('calendar_blocks').select('id,title,block_type,start_at,end_at').eq('workspace_id', workspaceId).lt('start_at', busyEnd.toISOString()).gt('end_at', busyStart.toISOString())
    ]);
    if (appointments.error) throw new InternalServerErrorException(appointments.error.message);
    if (blocks.error) throw new InternalServerErrorException(blocks.error.message);
    const hard = [...(appointments.data ?? []).map((item: any) => ({ type: 'appointment', ...item }))];
    const soft: unknown[] = [];
    for (const block of blocks.data ?? []) {
      if (HARD_BLOCK_TYPES.has((block as any).block_type)) hard.push({ type: 'block', ...block } as any);
      else soft.push({ type: 'block', ...block });
    }
    return { hard, soft };
  }

  private async appendEvent(supabase: ReturnType<typeof createUserSupabaseClient>, userId: string, workspaceId: string, appointmentId: string, eventType: string, fromState: unknown, toState: unknown) {
    const { error } = await supabase.from('appointment_events').insert({ workspace_id: workspaceId, appointment_id: appointmentId, event_type: eventType, from_state: fromState, to_state: toState, actor_user_id: userId });
    if (error) throw new InternalServerErrorException(`Appointment changed, but history log failed: ${error.message}`);
  }
}

function appointmentTimes(service: { duration_minutes: number; buffer_before_minutes: number; buffer_after_minutes: number }, startAt: string) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) throw new ConflictException('Invalid appointment start time');
  const end = new Date(start.getTime() + service.duration_minutes * 60_000);
  const busyStart = new Date(start.getTime() - service.buffer_before_minutes * 60_000);
  const busyEnd = new Date(end.getTime() + service.buffer_after_minutes * 60_000);
  return { start, end, busyStart, busyEnd };
}

function workingHoursConflictFromRows(start: Date, end: Date, timeZone: string, hours: any[]) {
  if (!hours.length) return null; // No configured rule yet: do not invent one.
  const localStart = localParts(start, timeZone);
  const localEnd = localParts(end, timeZone);
  if (localStart.dayOfWeek !== localEnd.dayOfWeek) {
    return { type: 'outside_hours', reason: 'Appointment crosses into another local calendar day.' };
  }
  const hour = hours.find((row) => Number(row.day_of_week) === localStart.dayOfWeek);
  if (!hour) return null;
  if (hour.is_closed) return { type: 'outside_hours', reason: 'Business hours mark this day as closed.' };
  const startMinutes = localStart.hour * 60 + localStart.minute;
  const endMinutes = localEnd.hour * 60 + localEnd.minute;
  const openMinutes = hhmmToMinutes(hour.start_time);
  const closeMinutes = hhmmToMinutes(hour.end_time);
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return { type: 'outside_hours', reason: `Requested time is outside normal hours ${hour.start_time}-${hour.end_time}.` };
  }
  return null;
}

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dayOfWeek: dayMap[map.weekday], hour: Number(map.hour), minute: Number(map.minute) };
}

function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function appointmentSnapshot(row: any) {
  return { status: row.status, startAt: row.start_at, endAt: row.end_at, serviceName: row.service_name, clientId: row.client_id, price: row.price_snapshot, currency: row.currency };
}
