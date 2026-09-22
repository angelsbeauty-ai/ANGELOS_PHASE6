import { apiFetch } from './api';

export interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  standard_price: number;
  currency: string;
}

export interface CalendarAppointment {
  id: string;
  service_name: string;
  start_at: string;
  end_at: string;
  status: string;
  client: { id: string; display_name: string } | null;
}

export interface CalendarBlock {
  id: string;
  title: string;
  block_type: string;
  start_at: string;
  end_at: string;
}

export function listServices(workspaceId: string) {
  return apiFetch<ServiceItem[]>('/workspaces/' + workspaceId + '/services');
}

export function createService(workspaceId: string, input: Record<string, unknown>) {
  return apiFetch<ServiceItem>('/workspaces/' + workspaceId + '/services', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function getCalendar(workspaceId: string, start: string, end: string) {
  return apiFetch<{ appointments: CalendarAppointment[]; blocks: CalendarBlock[] }>(
    '/workspaces/' + workspaceId + '/calendar?start=' + encodeURIComponent(start) + '&end=' + encodeURIComponent(end)
  );
}

export function createAppointment(workspaceId: string, input: Record<string, unknown>) {
  return apiFetch<{ appointment: CalendarAppointment; softConflictsAccepted: unknown[] }>(
    '/workspaces/' + workspaceId + '/appointments',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
}

export function confirmAppointment(workspaceId: string, appointmentId: string) {
  return apiFetch('/workspaces/' + workspaceId + '/appointments/' + appointmentId + '/confirm', { method: 'POST' });
}

export function cancelAppointment(workspaceId: string, appointmentId: string) {
  return apiFetch('/workspaces/' + workspaceId + '/appointments/' + appointmentId + '/cancel', { method: 'POST' });
}

export function completeAppointment(workspaceId: string, appointmentId: string) {
  return apiFetch('/workspaces/' + workspaceId + '/appointments/' + appointmentId + '/complete', { method: 'POST' });
}

export interface BusinessHourItem {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_closed: boolean;
}

export function listBusinessHours(workspaceId: string) {
  return apiFetch<BusinessHourItem[]>('/workspaces/' + workspaceId + '/business-hours');
}

export function setBusinessHours(
  workspaceId: string,
  hours: Array<{
    dayOfWeek: number;
    startTime?: string;
    endTime?: string;
    isClosed: boolean;
  }>
) {
  return apiFetch<BusinessHourItem[]>('/workspaces/' + workspaceId + '/business-hours', {
    method: 'PUT',
    body: JSON.stringify({ hours })
  });
}