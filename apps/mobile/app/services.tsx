import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import {
  createService,
  listBusinessHours,
  listServices,
  setBusinessHours,
  type BusinessHourItem,
  type ServiceItem
} from '../src/lib/bookings';
import { getActiveWorkspace, type WorkspaceSummary } from '../src/lib/workspace';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STARTER_SERVICES = [
  { name: 'PMU Consultation', durationMinutes: 30, standardPrice: 0, bufferAfterMinutes: 15 },
  { name: 'Brow Touch-up', durationMinutes: 90, standardPrice: 15000, bufferAfterMinutes: 15 },
  { name: 'Full Brow Session', durationMinutes: 150, standardPrice: 45000, bufferAfterMinutes: 15 }
] as const;

function defaultWeekHours() {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const isClosed = dayOfWeek === 0;
    return {
      dayOfWeek,
      isClosed,
      startTime: isClosed ? undefined : '10:00',
      endTime: isClosed ? undefined : '18:00'
    };
  });
}

export default function ServicesScreen() {
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [hours, setHours] = useState<BusinessHourItem[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [bufferBefore, setBufferBefore] = useState('');
  const [bufferAfter, setBufferAfter] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(true);
  const [setupBusy, setSetupBusy] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setBusy(true);
    try {
      const activeWorkspace = await getActiveWorkspace();
      setWorkspace(activeWorkspace);
      const [nextServices, nextHours] = await Promise.all([
        listServices(activeWorkspace.id),
        listBusinessHours(activeWorkspace.id)
      ]);
      setServices(nextServices);
      setHours(nextHours);
    } catch (error) {
      Alert.alert('Could not load services', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!workspace || !name.trim()) return;
    const durationMinutes = Number(duration);
    const beforeMinutes = bufferBefore.trim() ? Number(bufferBefore) : 0;
    const afterMinutes = bufferAfter.trim() ? Number(bufferAfter) : 0;
    const standardPrice = Number(price);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5) {
      return Alert.alert('Check duration', 'Enter a duration of at least 5 minutes.');
    }
    if (
      !Number.isInteger(beforeMinutes) ||
      beforeMinutes < 0 ||
      beforeMinutes > 240 ||
      !Number.isInteger(afterMinutes) ||
      afterMinutes < 0 ||
      afterMinutes > 240
    ) {
      return Alert.alert('Check buffers', 'Buffers must be whole minutes from 0 to 240.');
    }
    if (!Number.isFinite(standardPrice) || standardPrice < 0) {
      return Alert.alert('Check price', 'Enter the real standard price, or 0 only when the service is free.');
    }
    setBusy(true);
    try {
      await createService(workspace.id, {
        name: name.trim(),
        durationMinutes,
        bufferBeforeMinutes: beforeMinutes,
        bufferAfterMinutes: afterMinutes,
        standardPrice,
        currency: workspace.currency
      });
      setName('');
      setDuration('');
      setBufferBefore('');
      setBufferAfter('');
      setPrice('');
      setServices(await listServices(workspace.id));
      Alert.alert('Service added', 'AngelOS will use these exact rules when checking availability.');
    } catch (error) {
      Alert.alert('Could not create service', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function addStarterSet() {
    if (!workspace || setupBusy) return;
    setSetupBusy(true);
    try {
      for (const starter of STARTER_SERVICES) {
        const exists = services.some((s) => s.name.toLowerCase() === starter.name.toLowerCase());
        if (exists) continue;
        await createService(workspace.id, {
          name: starter.name,
          durationMinutes: starter.durationMinutes,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: starter.bufferAfterMinutes,
          standardPrice: starter.standardPrice,
          currency: workspace.currency
        });
      }
      setServices(await listServices(workspace.id));
      Alert.alert(
        'Starter services ready',
        'You can edit names, times and prices anytime. These are real booking rules - not demos.'
      );
    } catch (error) {
      Alert.alert('Could not add starter services', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSetupBusy(false);
    }
  }

  async function applyDefaultHours() {
    if (!workspace || setupBusy) return;
    setSetupBusy(true);
    try {
      const next = await setBusinessHours(workspace.id, defaultWeekHours());
      setHours(next);
      Alert.alert(
        'Hours saved',
        'Mon-Sat 10:00-18:00, Sunday closed. Change these later when your real schedule differs.'
      );
    } catch (error) {
      Alert.alert('Could not save hours', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSetupBusy(false);
    }
  }

  const canAdd = Boolean(workspace && name.trim() && duration.trim() && price.trim() && !busy);
  const needsServices = !busy && services.length === 0;
  const needsHours = !busy && hours.length < 7;

  return (
    <Screen>
      <View style={styles.stack}>
        <Pill tone="gold">Booking Rules</Pill>
        <ScreenTitle>Services</ScreenTitle>
        <SupportText>
          Your real services, timing and prices power reliable availability. AngelOS never fills in missing business facts.
        </SupportText>

        <Card premium>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <SupportText>Active services</SupportText>
              <Text style={styles.stat}>{services.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <SupportText>Workspace currency</SupportText>
              <Text style={styles.stat}>{workspace?.currency ?? '-'}</Text>
            </View>
          </View>
          <BodyText>
            Changes apply to future booking choices. Existing appointments keep the service, duration and price captured when they were booked.
          </BodyText>
        </Card>

        {needsServices || needsHours ? (
          <Card premium>
            <Pill tone="warning">First-run setup</Pill>
            <SectionTitle>Finish your booking basics</SectionTitle>
            <SupportText>
              Without services and open hours, AngelOS cannot check availability or take real bookings for this workspace.
            </SupportText>
            {needsServices ? (
              <Pressable
                disabled={setupBusy || !workspace}
                onPress={() => void addStarterSet()}
                style={({ pressed }) => [styles.action, (setupBusy || pressed || !workspace) && styles.muted]}
              >
                <PrimaryActionLabel>{setupBusy ? 'Saving...' : 'Add starter PMU services'}</PrimaryActionLabel>
              </Pressable>
            ) : null}
            {needsHours ? (
              <Pressable
                disabled={setupBusy || !workspace}
                onPress={() => void applyDefaultHours()}
                style={({ pressed }) => [styles.action, (setupBusy || pressed || !workspace) && styles.muted]}
              >
                <PrimaryActionLabel>{setupBusy ? 'Saving...' : 'Set Mon-Sat 10-18 hours'}</PrimaryActionLabel>
              </Pressable>
            ) : null}
            <SupportText>
              Starter set: Consultation, Brow Touch-up, Full Brow Session. Edit prices to match what you actually charge.
            </SupportText>
          </Card>
        ) : null}

        {busy && !services.length ? (
          <Card>
            <BodyText>Loading services...</BodyText>
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Current services</SectionTitle>
          {services.map((service) => (
            <View key={service.id} style={styles.service}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <SupportText>{service.duration_minutes} min service</SupportText>
                </View>
                <Text style={styles.price}>{formatMoney(Number(service.standard_price), service.currency)}</Text>
              </View>
              <View style={styles.pills}>
                <Pill>{service.buffer_before_minutes} min before</Pill>
                <Pill>{service.buffer_after_minutes} min after</Pill>
              </View>
            </View>
          ))}
          {!busy && !services.length ? (
            <SupportText>No services yet. Add only what you currently offer, or use the starter set above.</SupportText>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>Business hours</SectionTitle>
          {!busy && hours.length === 0 ? (
            <SupportText>No hours saved yet. Availability stays blocked until you set them.</SupportText>
          ) : (
            hours
              .slice()
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((day) => (
                <View key={day.day_of_week} style={styles.hourRow}>
                  <Text style={styles.hourDay}>{DAY_LABELS[day.day_of_week] ?? String(day.day_of_week)}</Text>
                  <SupportText>
                    {day.is_closed
                      ? 'Closed'
                      : `${(day.start_time ?? '').slice(0, 5)}-${(day.end_time ?? '').slice(0, 5)}`}
                  </SupportText>
                </View>
              ))
          )}
        </Card>

        <Card premium>
          <Pill tone="gold">Add One Service</Pill>
          <SectionTitle>Booking details</SectionTitle>
          <SupportText>Use the exact public name, real appointment length and standard price.</SupportText>
          <Field label="Service name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. service name"
              placeholderTextColor={ui.colors.secondaryText}
              autoCapitalize="words"
              style={styles.input}
            />
          </Field>
          <View style={styles.inputRow}>
            <View style={styles.flex}>
              <Field label="Duration (min)">
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Required"
                  placeholderTextColor={ui.colors.secondaryText}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label={`Price (${workspace?.currency ?? 'currency'})`}>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Required"
                  placeholderTextColor={ui.colors.secondaryText}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </Field>
            </View>
          </View>
          <SectionTitle>Protected time</SectionTitle>
          <SupportText>Optional buffers reserve preparation and reset time around the appointment.</SupportText>
          <View style={styles.inputRow}>
            <View style={styles.flex}>
              <Field label="Before (min)">
                <TextInput
                  value={bufferBefore}
                  onChangeText={setBufferBefore}
                  placeholder="0"
                  placeholderTextColor={ui.colors.secondaryText}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="After (min)">
                <TextInput
                  value={bufferAfter}
                  onChangeText={setBufferAfter}
                  placeholder="0"
                  placeholderTextColor={ui.colors.secondaryText}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>
          </View>
          <Pressable
            disabled={!canAdd}
            onPress={() => void add()}
            style={({ pressed }) => [styles.action, (!canAdd || pressed) && styles.muted]}
          >
            <PrimaryActionLabel>{busy ? 'Saving...' : 'Add Service'}</PrimaryActionLabel>
          </Pressable>
        </Card>

        <Card>
          <SectionTitle>Availability safeguard</SectionTitle>
          <SupportText>
            Hard calendar conflicts and personal busy time remain unavailable. AngelOS does not create business hours or overbook without an explicit owner-reviewed action.
          </SupportText>
        </Card>
      </View>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

const styles = StyleSheet.create({
  stack: { gap: ui.spacing.md },
  summary: { flexDirection: 'row', gap: ui.spacing.md },
  summaryItem: { flex: 1, gap: 2 },
  stat: { color: ui.colors.primaryText, fontSize: 28, fontWeight: '700' },
  service: {
    gap: ui.spacing.xs,
    paddingVertical: ui.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ui.colors.border
  },
  serviceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ui.spacing.sm
  },
  serviceCopy: { flex: 1, gap: 2 },
  serviceName: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' },
  price: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: ui.spacing.xs },
  hourRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: ui.colors.border
  },
  hourDay: { color: ui.colors.primaryText, fontSize: 15, fontWeight: '700' },
  field: { gap: ui.spacing.xs },
  label: { color: ui.colors.primaryText, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    paddingHorizontal: ui.spacing.sm,
    color: ui.colors.primaryText,
    backgroundColor: ui.colors.elevated,
    fontSize: 16
  },
  inputRow: { flexDirection: 'row', gap: ui.spacing.sm },
  flex: { flex: 1 },
  action: { borderRadius: ui.radius.control, marginTop: ui.spacing.xs },
  muted: { opacity: 0.55 }
});