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
import { confirmAppointment, getCalendar, type CalendarAppointment, type CalendarBlock } from '../src/lib/bookings';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function CalendarScreen() {
  const { focusLabel } = useLocalSearchParams<{ focusLabel?: string }>();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [busy, setBusy] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  // An appointment booked in AngelOS is created as confirmation_pending. Until it is confirmed it
  // never queues its reminder automations, so the owner needs to be able to confirm it here.
  async function confirm(appointmentId: string) {
    if (confirmingId) return;
    setConfirmingId(appointmentId);
    try {
      const workspace = await getActiveWorkspace();
      await confirmAppointment(workspace.id, appointmentId);
      await load();
    } catch (error) {
      Alert.alert('Could not confirm booking', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setConfirmingId(null);
    }
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
          {item.appointmentId && (item.status === 'confirmation_pending' || item.status === 'request') ? (
            <Pressable
              onPress={() => void confirm(item.appointmentId as string)}
              disabled={confirmingId !== null}
              style={confirmingId !== null ? styles.mutedAction : undefined}
            >
              <PrimaryActionLabel>
                {confirmingId === item.appointmentId ? 'Confirming...' : 'Confirm Booking'}
              </PrimaryActionLabel>
            </Pressable>
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
