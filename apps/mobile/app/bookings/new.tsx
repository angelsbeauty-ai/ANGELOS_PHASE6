import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import {
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  ScreenTitle,
  SecondaryActionLabel,
  SectionTitle,
  SupportText,
  ui
} from '../../src/components/ui';
import { ApiError } from '../../src/lib/api';
import { createAppointment, listServices, type ServiceItem } from '../../src/lib/bookings';
import { listClients, type ClientSummary } from '../../src/lib/clients';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function NewBookingScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState('10:00');
  const [softConflict, setSoftConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const request = useRef({ details: '', key: '' });

  useEffect(() => { void load(); }, []);
  async function load() {
    try {
      const workspace = await getActiveWorkspace();
      setWorkspaceId(workspace.id);
      const [clientRows, serviceRows] = await Promise.all([listClients(workspace.id), listServices(workspace.id)]);
      setClients(clientRows); setServices(serviceRows);
    } catch (error) { Alert.alert('Booking setup needs attention', error instanceof Error ? error.message : 'Unknown error'); }
  }

  const selectedClient = useMemo(() => clients.find((item) => item.id === clientId), [clients, clientId]);
  const selectedService = useMemo(() => services.find((item) => item.id === serviceId), [services, serviceId]);

  async function save(overrideSoftConflict = false) {
    if (!workspaceId || !clientId || !serviceId || saving.current) return;
    saving.current = true;
    setBusy(true); setSoftConflict(false);
    try {
      const startAt = localDateTimeToIso(date, time);
      const details = JSON.stringify([workspaceId, clientId, serviceId, startAt]);
      if (request.current.details !== details) request.current = { details, key: `booking-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      const result = await createAppointment(workspaceId, { clientId, serviceId, startAt, source: 'owner', overrideSoftConflict, idempotencyKey: request.current.key });
      Alert.alert('Booking created', `${selectedClient?.display_name ?? 'Client'} | ${selectedService?.name ?? 'Service'}`);
      router.replace('/calendar');
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && typeof error.payload === 'object' && error.payload && (error.payload as any).code === 'SOFT_CONFLICT') {
        setSoftConflict(true); return;
      }
      Alert.alert('Could not create booking', error instanceof Error ? error.message : 'Unknown error');
    } finally { saving.current = false; setBusy(false); }
  }

  return <Screen>
    <View style={styles.hero}>
      <Pill tone="gold">Conflict Protected</Pill>
      <ScreenTitle>New Booking</ScreenTitle>
      <SupportText>Choose the client, service and time. AngelOS checks the schedule before creating it.</SupportText>
    </View>

    <Card>
      <SectionTitle>Client</SectionTitle>
      {clients.length === 0 ? <SupportText>Create a client first, then return to booking.</SupportText> : null}
      <View style={styles.options}>
        {clients.slice(0, 12).map((client) => (
          <Pressable key={client.id} onPress={() => setClientId(client.id)} style={[styles.option, clientId === client.id && styles.selected]}>
            <Text style={[styles.optionTitle, clientId === client.id && styles.selectedText]}>{client.display_name}</Text>
          </Pressable>
        ))}
      </View>
    </Card>

    <Card>
      <SectionTitle>Service</SectionTitle>
      {services.length === 0 ? <SupportText>Create a service from the Services screen first.</SupportText> : null}
      <View style={styles.options}>
        {services.map((service) => (
          <Pressable key={service.id} onPress={() => setServiceId(service.id)} style={[styles.option, serviceId === service.id && styles.selected]}>
            <Text style={[styles.optionTitle, serviceId === service.id && styles.selectedText]}>{service.name}</Text>
            <SupportText>{service.duration_minutes} min | {service.currency} {service.standard_price}</SupportText>
          </Pressable>
        ))}
      </View>
    </Card>

    <Card>
      <SectionTitle>Date & Time</SectionTitle>
      <SupportText>Use 24-hour time so the booking is stored clearly.</SupportText>
      <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
      <TextInput value={time} onChangeText={setTime} placeholder="HH:mm" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
    </Card>

    {softConflict ? (
      <Card>
        <View style={styles.warningHeader}>
          <SectionTitle>Flexible Conflict</SectionTitle>
          <Pill tone="warning">review</Pill>
        </View>
        <BodyText>This time has a soft or conditional block. If you checked it and still want this booking, you can continue.</BodyText>
        <Pressable onPress={() => void save(true)} style={styles.primaryAction}>
          <SecondaryActionLabel>Book Anyway</SecondaryActionLabel>
        </Pressable>
      </Card>
    ) : null}

    <Pressable disabled={busy || !clientId || !serviceId} onPress={() => void save(false)} style={styles.primaryAction}>
      <PrimaryActionLabel>{busy ? 'Checking...' : 'Check & Create Booking'}</PrimaryActionLabel>
    </Pressable>
  </Screen>;
}

function defaultDate() { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function localDateTimeToIso(date: string, time: string) { const parsed = new Date(`${date}T${time}:00`); if (Number.isNaN(parsed.getTime())) throw new Error('Enter a valid date and time'); return parsed.toISOString(); }

const styles = StyleSheet.create({
  hero: { gap: ui.spacing.xs },
  options: { gap: ui.spacing.xs },
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    padding: ui.spacing.sm,
    gap: 2,
    backgroundColor: ui.colors.elevated
  },
  selected: { borderColor: ui.colors.gold, backgroundColor: ui.colors.softGold },
  optionTitle: { color: ui.colors.primaryText, fontSize: 16, fontWeight: '700' },
  selectedText: { color: ui.colors.primaryText },
  input: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    padding: ui.spacing.sm,
    fontSize: 16
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  primaryAction: { marginTop: ui.spacing.xs }
});
