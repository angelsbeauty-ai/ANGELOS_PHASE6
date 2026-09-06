import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Screen } from '../src/components/Screen';
import {
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  Row,
  ScreenTitle,
  SecondaryActionLabel,
  SectionTitle,
  SupportText,
  ui
} from '../src/components/ui';
import { cancelAppointment, completeAppointment, confirmAppointment, getCalendar, type CalendarAppointment, type CalendarBlock } from '../src/lib/bookings';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function CalendarScreen() {
  const { focusLabel } = useLocalSearchParams<{ focusLabel?: string }>();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [busy, setBusy] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  // The API exposes confirm/cancel/complete, but only confirm had a caller, so a booking made in
  // AngelOS could never be finished or called off from the app. An appointment is created as
  // confirmation_pending and does not queue its reminder automations until it is confirmed.
  async function runAction(appointmentId: string, action: 'confirm' | 'cancel' | 'complete') {
    if (pendingId) return;
    setPendingId(appointmentId);
    try {
      const workspace = await getActiveWorkspace();
      if (action === 'confirm') await confirmAppointment(workspace.id, appointmentId);
      else if (action === 'cancel') await cancelAppointment(workspace.id, appointmentId);
      else await completeAppointment(workspace.id, appointmentId);
      await load();
    } catch (error) {
      Alert.alert(`Could not ${action} booking`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPendingId(null);
    }
  }

  // Cancelling also cancels the booking's queued reminders and cannot be undone from here, so it
  // asks first rather than acting on a single tap.
  function confirmCancel(appointmentId: string, title: string) {
    Alert.alert('Cancel this booking?', `${title}\n\nThis also cancels its reminders and cannot be undone here.`, [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => void runAction(appointmentId, 'cancel') }
    ]);
  }

  async function load() {
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      const start = startOfToday();
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const data = await getCalendar(workspace.id, start.toISOString(), end.toISOString());
      setAppointments(data.appointments);
      setBlocks(data.blocks);
    } catch (error) { Alert.alert('Could not load calendar', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setBusy(false); }
  }

  const items = [
    ...appointments.map((item) => ({ id: `a-${item.id}`, start: item.start_at, kind: 'appointment', title: `${item.client?.display_name ?? 'Client'} | ${item.service_name}`, detail: item.status, appointmentId: item.id, status: item.status })),
    ...blocks.map((item) => ({ id: `b-${item.id}`, start: item.start_at, kind: 'block', title: item.title, detail: `${item.block_type} block`, appointmentId: null as string | null, status: null as string | null }))
  ].sort((a, b) => a.start.localeCompare(b.start));

  return <Screen>
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Pill tone="gold">Next 7 Days</Pill>
        <ScreenTitle>Calendar</ScreenTitle>
        <SupportText>Appointments, model blocks, classes and conflict checks.</SupportText>
      </View>
      <Link href="/bookings/new" asChild>
        <Pressable style={styles.newBookingButton}>
          <PrimaryActionLabel>New Booking</PrimaryActionLabel>
        </Pressable>
      </Link>
    </View>

    {focusLabel ? (
      <Card premium>
        <SectionTitle>Checking Availability</SectionTitle>
        <BodyText>{focusLabel}</BodyText>
      </Card>
    ) : null}

    <Card>
      <Row>
        <View>
          <SectionTitle>Calendar Controls</SectionTitle>
          <SupportText>Services control duration, buffers and price snapshots.</SupportText>
        </View>
      </Row>
      <View style={styles.controlRow}>
        <Link href="/services" style={styles.serviceLink}>Manage Services</Link>
        <Pressable onPress={() => void load()} style={styles.refreshButton}>
          <SecondaryActionLabel>Refresh</SecondaryActionLabel>
        </Pressable>
      </View>
    </Card>

    {busy ? <Card><BodyText>Loading calendar...</BodyText></Card> : null}
    {!busy && items.length === 0 ? (
      <Card>
        <SectionTitle>No bookings yet</SectionTitle>
        <SupportText>No appointments or blocks in the next 7 days.</SupportText>
      </Card>
    ) : null}

    <View style={styles.timeline}>
      {items.map((item) => (
        <Card key={item.id} premium={item.kind === 'appointment'}>
          <View style={styles.itemHeader}>
            <Pill tone={item.kind === 'appointment' ? 'gold' : 'secondary'}>{item.kind}</Pill>
            <SupportText>{formatCalendarTime(item.start)}</SupportText>
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <SupportText>{item.detail.replaceAll('_', ' ')}</SupportText>
          {item.appointmentId ? (
            <View style={styles.actionRow}>
              {item.status === 'confirmation_pending' || item.status === 'request' ? (
                <Pressable onPress={() => void runAction(item.appointmentId as string, 'confirm')} disabled={pendingId !== null} style={pendingId !== null ? styles.mutedAction : undefined}>
                  <PrimaryActionLabel>{pendingId === item.appointmentId ? 'Working...' : 'Confirm Booking'}</PrimaryActionLabel>
                </Pressable>
              ) : null}
              {['confirmed', 'arrival_info_sent', 'checked_in'].includes(item.status ?? '') ? (
                <Pressable onPress={() => void runAction(item.appointmentId as string, 'complete')} disabled={pendingId !== null} style={pendingId !== null ? styles.mutedAction : undefined}>
                  <PrimaryActionLabel>{pendingId === item.appointmentId ? 'Working...' : 'Mark Completed'}</PrimaryActionLabel>
                </Pressable>
              ) : null}
              {['confirmation_pending', 'request', 'confirmed', 'arrival_info_sent', 'checked_in'].includes(item.status ?? '') ? (
                <Pressable onPress={() => confirmCancel(item.appointmentId as string, item.title)} disabled={pendingId !== null} style={pendingId !== null ? styles.mutedAction : undefined}>
                  <SecondaryActionLabel>Cancel Booking</SecondaryActionLabel>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  </Screen>;
}

function startOfToday() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
function formatCalendarTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  mutedAction: { opacity: 0.55 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.md, flexWrap: 'wrap' },
  newBookingButton: { width: 132 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.sm },
  serviceLink: {
    flex: 1,
    color: ui.colors.gold,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: ui.spacing.sm
  },
  refreshButton: { width: 104 },
  timeline: { gap: ui.spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  itemTitle: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' }
});
