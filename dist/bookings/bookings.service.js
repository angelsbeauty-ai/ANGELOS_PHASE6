"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const automations_service_1 = require("../automations/automations.service");
const node_crypto_1 = require("node:crypto");
const ACTIVE_APPOINTMENT_STATUSES = ['confirmation_pending', 'confirmed', 'arrival_info_sent', 'checked_in'];
const HARD_BLOCK_TYPES = new Set(['hard', 'personal']);
let BookingsService = class BookingsService {
    automations;
    constructor(automations) {
        this.automations = automations;
    }
    async listServices(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('services').select('*').eq('workspace_id', workspaceId).eq('active', true).order('name');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async createService(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('currency').eq('id', workspaceId).single();
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
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
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data;
    }
    async getBusinessHours(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('business_hours').select('*').eq('workspace_id', workspaceId).order('day_of_week');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async setBusinessHours(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const rows = dto.hours.map((hour) => ({
            workspace_id: workspaceId,
            day_of_week: hour.dayOfWeek,
            start_time: hour.isClosed ? null : hour.startTime ?? null,
            end_time: hour.isClosed ? null : hour.endTime ?? null,
            is_closed: hour.isClosed,
            updated_at: new Date().toISOString()
        }));
        const invalid = rows.find((row) => !row.is_closed && (!row.start_time || !row.end_time));
        if (invalid)
            throw new common_1.ConflictException('Open business hours require start and end times');
        const { error } = await supabase.from('business_hours').upsert(rows, { onConflict: 'workspace_id,day_of_week' });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return this.getBusinessHours(user, workspaceId);
    }
    async createBlock(user, workspaceId, dto) {
        const start = new Date(dto.startAt);
        const end = new Date(dto.endAt);
        if (!(start < end))
            throw new common_1.ConflictException('Calendar block end must be after start');
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('calendar_blocks').insert({
            workspace_id: workspaceId,
            title: dto.title.trim(),
            block_type: dto.blockType,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            notes: dto.notes?.trim() || null,
            created_by: user.id
        }).select('*').single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data;
    }
    async calendar(user, workspaceId, windowStart, windowEnd) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const start = new Date(windowStart);
        const end = new Date(windowEnd);
        if (!(start < end))
            throw new common_1.ConflictException('Invalid calendar window');
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
        if (appointments.error)
            throw new common_1.InternalServerErrorException(appointments.error.message);
        if (blocks.error)
            throw new common_1.InternalServerErrorException(blocks.error.message);
        return { appointments: appointments.data ?? [], blocks: blocks.data ?? [] };
    }
    async availability(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const service = await this.getService(supabase, workspaceId, dto.serviceId);
        const windowStart = new Date(dto.windowStart);
        const windowEnd = new Date(dto.windowEnd);
        if (!(windowStart < windowEnd))
            throw new common_1.ConflictException('Invalid availability window');
        const step = dto.stepMinutes ?? 30;
        const busyBefore = service.buffer_before_minutes * 60_000;
        const busyAfter = service.buffer_after_minutes * 60_000;
        const duration = service.duration_minutes * 60_000;
        const rangeStart = new Date(windowStart.getTime() - busyBefore);
        const rangeEnd = new Date(windowEnd.getTime() + busyAfter);
        const [appointments, blocks, workspaceResult, hoursResult] = await Promise.all([
            supabase.from('appointments').select('id,busy_start_at,busy_end_at,status').eq('workspace_id', workspaceId).in('status', ACTIVE_APPOINTMENT_STATUSES).lt('busy_start_at', rangeEnd.toISOString()).gt('busy_end_at', rangeStart.toISOString()),
            supabase.from('calendar_blocks').select('id,title,block_type,start_at,end_at').eq('workspace_id', workspaceId).lt('start_at', rangeEnd.toISOString()).gt('end_at', rangeStart.toISOString()),
            supabase.from('workspaces').select('timezone').eq('id', workspaceId).single(),
            supabase.from('business_hours').select('*').eq('workspace_id', workspaceId)
        ]);
        if (appointments.error)
            throw new common_1.InternalServerErrorException(appointments.error.message);
        if (blocks.error)
            throw new common_1.InternalServerErrorException(blocks.error.message);
        if (workspaceResult.error || !workspaceResult.data)
            throw new common_1.NotFoundException('Workspace not found');
        if (hoursResult.error)
            throw new common_1.InternalServerErrorException(hoursResult.error.message);
        const hoursRows = hoursResult.data ?? [];
        const slots = [];
        for (let cursor = windowStart.getTime(); cursor + duration <= windowEnd.getTime(); cursor += step * 60_000) {
            const start = new Date(cursor);
            const end = new Date(cursor + duration);
            const busyStart = new Date(cursor - busyBefore);
            const busyEnd = new Date(cursor + duration + busyAfter);
            const appointmentConflict = (appointments.data ?? []).some((item) => overlaps(busyStart, busyEnd, new Date(item.busy_start_at), new Date(item.busy_end_at)));
            if (appointmentConflict)
                continue;
            const overlappingBlocks = (blocks.data ?? []).filter((item) => overlaps(busyStart, busyEnd, new Date(item.start_at), new Date(item.end_at)));
            if (overlappingBlocks.some((block) => HARD_BLOCK_TYPES.has(block.block_type)))
                continue;
            const softBlocks = overlappingBlocks.filter((block) => !HARD_BLOCK_TYPES.has(block.block_type));
            const hoursConflict = workingHoursConflictFromRows(start, end, workspaceResult.data.timezone, hoursRows);
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
    async createAppointment(user, workspaceId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const requestId = dto.idempotencyKey ? bookingRequestId(workspaceId, dto.idempotencyKey) : undefined;
        if (requestId) {
            const prior = await this.findBookingRequest(supabase, workspaceId, requestId, dto);
            if (prior)
                return { appointment: prior, softConflictsAccepted: [], duplicatePrevented: true };
        }
        await this.assertClient(supabase, workspaceId, dto.clientId);
        const service = await this.getService(supabase, workspaceId, dto.serviceId);
        const times = appointmentTimes(service, dto.startAt);
        const conflicts = await this.getConflicts(supabase, workspaceId, times.busyStart, times.busyEnd);
        const hoursConflict = await this.getWorkingHoursConflict(supabase, workspaceId, times.start, times.end);
        if (hoursConflict)
            conflicts.soft.push(hoursConflict);
        if (conflicts.hard.length)
            throw new common_1.ConflictException({ code: 'HARD_CONFLICT', message: 'That time is unavailable.', conflicts: conflicts.hard });
        if (conflicts.soft.length && !dto.overrideSoftConflict) {
            throw new common_1.ConflictException({ code: 'SOFT_CONFLICT', message: 'This time has a flexible/conditional conflict. Owner decision required.', conflicts: conflicts.soft });
        }
        const insert = {
            ...(requestId ? { id: requestId } : {}),
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
            if (requestId && ['23505', '23P01'].includes(error.code)) {
                const prior = await this.findBookingRequest(supabase, workspaceId, requestId, dto);
                if (prior)
                    return { appointment: prior, softConflictsAccepted: [], duplicatePrevented: true };
            }
            if (error.code === '23P01')
                throw new common_1.ConflictException('That time was just booked. Please choose another slot.');
            throw new common_1.InternalServerErrorException(error.message);
        }
        await this.appendEvent(supabase, user.id, workspaceId, data.id, 'created', null, appointmentSnapshot(data));
        return { appointment: data, softConflictsAccepted: conflicts.soft };
    }
    async findBookingRequest(supabase, workspaceId, requestId, dto) {
        const { data, error } = await supabase.from('appointments').select('*,client:clients(id,display_name)').eq('workspace_id', workspaceId).eq('id', requestId).maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (data && (data.client_id !== dto.clientId || data.service_id !== dto.serviceId || new Date(data.start_at).getTime() !== new Date(dto.startAt).getTime() || (data.source ?? null) !== (dto.source?.trim() || null) || (data.notes ?? null) !== (dto.notes?.trim() || null))) {
            throw new common_1.ConflictException('Booking request key was already used for different details');
        }
        return data;
    }
    async confirm(user, workspaceId, appointmentId) {
        const appointment = await this.transition(user, workspaceId, appointmentId, 'confirmed', 'confirmed', ['request', 'confirmation_pending']);
        try {
            const automationJobs = await this.automations.queueForAppointmentEvent(user, workspaceId, appointmentId, 'appointment_confirmed');
            return { appointment, automationJobs };
        }
        catch (error) {
            return { appointment, automationJobs: [], automationWarning: error instanceof Error ? error.message : 'Automation planning failed' };
        }
    }
    async cancel(user, workspaceId, appointmentId) {
        const appointment = await this.transition(user, workspaceId, appointmentId, 'cancelled', 'cancelled', ACTIVE_APPOINTMENT_STATUSES.concat('request'));
        await this.automations.cancelAppointmentJobs(user, workspaceId, appointmentId);
        return { appointment };
    }
    async complete(user, workspaceId, appointmentId) {
        const appointment = await this.transition(user, workspaceId, appointmentId, 'completed', 'completed', ['confirmed', 'arrival_info_sent', 'checked_in']);
        try {
            const automationJobs = await this.automations.queueForAppointmentEvent(user, workspaceId, appointmentId, 'appointment_completed');
            return { appointment, automationJobs };
        }
        catch (error) {
            return { appointment, automationJobs: [], automationWarning: error instanceof Error ? error.message : 'Automation planning failed' };
        }
    }
    async reschedule(user, workspaceId, appointmentId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: current, error: currentError } = await supabase.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
        if (currentError || !current)
            throw new common_1.NotFoundException('Appointment not found');
        if (['cancelled', 'completed', 'no_show'].includes(current.status))
            throw new common_1.ConflictException('This appointment can no longer be rescheduled');
        if (new Date(current.start_at).getTime() === new Date(dto.startAt).getTime())
            return { appointment: current, softConflictsAccepted: [], duplicatePrevented: true };
        const service = {
            duration_minutes: current.duration_minutes,
            buffer_before_minutes: current.buffer_before_minutes,
            buffer_after_minutes: current.buffer_after_minutes
        };
        const times = appointmentTimes(service, dto.startAt);
        const conflicts = await this.getConflicts(supabase, workspaceId, times.busyStart, times.busyEnd, appointmentId);
        const hoursConflict = await this.getWorkingHoursConflict(supabase, workspaceId, times.start, times.end);
        if (hoursConflict)
            conflicts.soft.push(hoursConflict);
        if (conflicts.hard.length)
            throw new common_1.ConflictException({ code: 'HARD_CONFLICT', message: 'That time is unavailable.', conflicts: conflicts.hard });
        if (conflicts.soft.length && !dto.overrideSoftConflict)
            throw new common_1.ConflictException({ code: 'SOFT_CONFLICT', message: 'Owner decision required for this flexible conflict.', conflicts: conflicts.soft });
        const { data, error } = await supabase.from('appointments').update({
            start_at: times.start.toISOString(), end_at: times.end.toISOString(), busy_start_at: times.busyStart.toISOString(), busy_end_at: times.busyEnd.toISOString(), updated_at: new Date().toISOString()
        }).eq('workspace_id', workspaceId).eq('id', appointmentId).eq('status', current.status).eq('start_at', current.start_at).eq('updated_at', current.updated_at).select('*,client:clients(id,display_name)').maybeSingle();
        if (error) {
            if (error.code === '23P01')
                throw new common_1.ConflictException('That time was just booked. Please choose another slot.');
            throw new common_1.InternalServerErrorException(error.message);
        }
        if (!data)
            throw new common_1.ConflictException('Appointment changed concurrently. Refresh before retrying.');
        await this.appendEvent(supabase, user.id, workspaceId, appointmentId, 'rescheduled', appointmentSnapshot(current), appointmentSnapshot(data));
        return { appointment: data, softConflictsAccepted: conflicts.soft };
    }
    async transition(user, workspaceId, appointmentId, status, eventType, allowedFrom) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: current, error: currentError } = await supabase.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
        if (currentError || !current)
            throw new common_1.NotFoundException('Appointment not found');
        if (current.status === status)
            return current;
        if (!allowedFrom.includes(current.status)) {
            throw new common_1.ConflictException(`This appointment is ${String(current.status).replaceAll('_', ' ')} and can no longer be marked ${status}.`);
        }
        const { data, error } = await supabase
            .from('appointments')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('workspace_id', workspaceId)
            .eq('id', appointmentId)
            .eq('status', current.status)
            .eq('updated_at', current.updated_at)
            .select('*,client:clients(id,display_name)')
            .maybeSingle();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (!data)
            throw new common_1.ConflictException('Appointment changed concurrently. Refresh before retrying.');
        await this.appendEvent(supabase, user.id, workspaceId, appointmentId, eventType, appointmentSnapshot(current), appointmentSnapshot(data));
        return data;
    }
    async getService(supabase, workspaceId, serviceId) {
        const { data, error } = await supabase.from('services').select('*').eq('workspace_id', workspaceId).eq('id', serviceId).eq('active', true).single();
        if (error || !data)
            throw new common_1.NotFoundException('Service not found');
        return data;
    }
    async assertClient(supabase, workspaceId, clientId) {
        const { data, error } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', clientId).single();
        if (error || !data)
            throw new common_1.NotFoundException('Client not found');
    }
    async getWorkingHoursConflict(supabase, workspaceId, start, end) {
        const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('timezone').eq('id', workspaceId).single();
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
        const { data: hours, error } = await supabase.from('business_hours').select('*').eq('workspace_id', workspaceId);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return workingHoursConflictFromRows(start, end, workspace.timezone, hours ?? []);
    }
    async getConflicts(supabase, workspaceId, busyStart, busyEnd, excludeAppointmentId) {
        let appointmentQuery = supabase.from('appointments').select('id,start_at,end_at,status').eq('workspace_id', workspaceId).in('status', ACTIVE_APPOINTMENT_STATUSES).lt('busy_start_at', busyEnd.toISOString()).gt('busy_end_at', busyStart.toISOString());
        if (excludeAppointmentId)
            appointmentQuery = appointmentQuery.neq('id', excludeAppointmentId);
        const [appointments, blocks] = await Promise.all([
            appointmentQuery,
            supabase.from('calendar_blocks').select('id,title,block_type,start_at,end_at').eq('workspace_id', workspaceId).lt('start_at', busyEnd.toISOString()).gt('end_at', busyStart.toISOString())
        ]);
        if (appointments.error)
            throw new common_1.InternalServerErrorException(appointments.error.message);
        if (blocks.error)
            throw new common_1.InternalServerErrorException(blocks.error.message);
        const hard = [...(appointments.data ?? []).map((item) => ({ type: 'appointment', ...item }))];
        const soft = [];
        for (const block of blocks.data ?? []) {
            if (HARD_BLOCK_TYPES.has(block.block_type))
                hard.push({ type: 'block', ...block });
            else
                soft.push({ type: 'block', ...block });
        }
        return { hard, soft };
    }
    async appendEvent(supabase, userId, workspaceId, appointmentId, eventType, fromState, toState) {
        const { error } = await supabase.from('appointment_events').insert({ workspace_id: workspaceId, appointment_id: appointmentId, event_type: eventType, from_state: fromState, to_state: toState, actor_user_id: userId });
        if (error)
            throw new common_1.InternalServerErrorException(`Appointment changed, but history log failed: ${error.message}`);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [automations_service_1.AutomationsService])
], BookingsService);
function bookingRequestId(workspaceId, key) {
    const digest = (0, node_crypto_1.createHash)('sha256').update(JSON.stringify([workspaceId, key])).digest('hex');
    return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}
function appointmentTimes(service, startAt) {
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime()))
        throw new common_1.ConflictException('Invalid appointment start time');
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    const busyStart = new Date(start.getTime() - service.buffer_before_minutes * 60_000);
    const busyEnd = new Date(end.getTime() + service.buffer_after_minutes * 60_000);
    return { start, end, busyStart, busyEnd };
}
function workingHoursConflictFromRows(start, end, timeZone, hours) {
    if (!hours.length)
        return null;
    const localStart = localParts(start, timeZone);
    const localEnd = localParts(end, timeZone);
    if (localStart.dayOfWeek !== localEnd.dayOfWeek) {
        return { type: 'outside_hours', reason: 'Appointment crosses into another local calendar day.' };
    }
    const hour = hours.find((row) => Number(row.day_of_week) === localStart.dayOfWeek);
    if (!hour)
        return null;
    if (hour.is_closed)
        return { type: 'outside_hours', reason: 'Business hours mark this day as closed.' };
    const startMinutes = localStart.hour * 60 + localStart.minute;
    const endMinutes = localEnd.hour * 60 + localEnd.minute;
    const openMinutes = hhmmToMinutes(hour.start_time);
    const closeMinutes = hhmmToMinutes(hour.end_time);
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
        return { type: 'outside_hours', reason: `Requested time is outside normal hours ${hour.start_time}-${hour.end_time}.` };
    }
    return null;
}
function localParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dayOfWeek: dayMap[map.weekday], hour: Number(map.hour), minute: Number(map.minute) };
}
function hhmmToMinutes(value) {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
}
function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
}
function appointmentSnapshot(row) {
    return { status: row.status, startAt: row.start_at, endAt: row.end_at, serviceName: row.service_name, clientId: row.client_id, price: row.price_snapshot, currency: row.currency };
}
//# sourceMappingURL=bookings.service.js.map