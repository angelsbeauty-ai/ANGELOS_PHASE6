import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
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
import { addClientNote, addTreatment, getClient, recordConsent, updateClient, type ClientDetail, type ConsentType } from '../../src/lib/clients';
import { recordFinanceEntry } from '../../src/lib/finance';
import { getActiveWorkspace } from '../../src/lib/workspace';

const CONSENT_TYPES: ConsentType[] = ['treatment', 'photo_video', 'marketing', 'model_student', 'policy_acknowledgement'];

function newPaymentKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [note, setNote] = useState('');
  const [service, setService] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [busy, setBusy] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingFlag, setSavingFlag] = useState(false);
  const [savingConsent, setSavingConsent] = useState<ConsentType | null>(null);
  // One key per payment the owner is entering, NOT per submit. A retry or a double tap has to
  // send the same key for the server's unique index on (workspace_id, idempotency_key) to collapse
  // it into one entry; it is rotated only after a payment is actually recorded, so a genuine
  // second payment for the same amount still goes through.
  const [paymentKey, setPaymentKey] = useState(newPaymentKey);

  useEffect(() => { if (id) void load(); }, [id]);

  async function load() {
    if (!id) return;
    setBusy(true);
    try {
      const workspace = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
      if (!workspaceId) setWorkspaceId(workspace.id);
      setDetail(await getClient(workspace.id, id));
    } catch (error) {
      Alert.alert('Could not load client', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!workspaceId || !id || !note.trim()) return;
    await addClientNote(workspaceId, id, note.trim());
    setNote('');
    await load();
  }


  async function toggleAutoMessage() {
    if (!workspaceId || !id || !detail || savingFlag) return;
    setSavingFlag(true);
    try {
      await updateClient(workspaceId, id, { doNotAutoMessage: !detail.client.do_not_auto_message });
      await load();
    } catch (error) {
      Alert.alert('Could not update client', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingFlag(false);
    }
  }

  async function saveConsent(consentType: ConsentType, status: 'granted' | 'withdrawn') {
    if (!workspaceId || !id || savingConsent) return;
    setSavingConsent(consentType);
    try {
      await recordConsent(workspaceId, id, consentType, status);
      await load();
    } catch (error) {
      Alert.alert('Could not record consent', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingConsent(null);
    }
  }

  async function savePayment() {
    if (!workspaceId || !id || savingPayment) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSavingPayment(true);
    try {
      await recordFinanceEntry(workspaceId, {
        clientId: id,
        entryType: 'payment',
        amount,
        method: paymentMethod.trim() || 'other',
        idempotencyKey: `client-payment:${id}:${paymentKey}`
      });
      setPaymentAmount('');
      // Only now does this become a different payment.
      setPaymentKey(newPaymentKey());
      await load();
    } catch (error) {
      // Deliberately keep the same key so a retry after a failure still deduplicates.
      Alert.alert('Could not record payment', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingPayment(false);
    }
  }

  async function saveTreatment() {
    if (!workspaceId || !id || !service.trim()) return;
    await addTreatment(workspaceId, id, { serviceName: service.trim(), stage: 'first_session' });
    setService('');
    await load();
  }

  if (busy && !detail) return <Screen><Card><BodyText>Loading client...</BodyText></Card></Screen>;
  if (!detail || !id) return <Screen><Card><BodyText>Client not found.</BodyText></Card></Screen>;
  const { client } = detail;

  return (
    <Screen>
      <Card premium>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{client.display_name.slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.headerCopy}>
            <Pill tone={client.do_not_auto_message ? 'warning' : 'gold'}>{client.do_not_auto_message ? 'manual only' : 'client profile'}</Pill>
            <ScreenTitle>{client.display_name}</ScreenTitle>
            <SupportText>{client.status.replaceAll('_', ' ')} | {client.language}</SupportText>
          </View>
          <Link
            href={{ pathname: '/ai', params: { screen: 'client', entityType: 'client', entityId: client.id, entityLabel: client.display_name } }}
            style={styles.aiLink}
          >
            Ask AI
          </Link>
        </View>
      </Card>

      <Card>
        <SectionTitle>Client Summary</SectionTitle>
        <BodyText>{client.phone ?? 'No phone saved'}</BodyText>
        <BodyText>{client.email ?? 'No email saved'}</BodyText>
        {client.do_not_auto_message ? <SupportText tone="warning">Do Not Auto-Message is enabled.</SupportText> : null}
        {/* The API enforces this flag on every AI send, but nothing in the app could set it. */}
        <Pressable onPress={() => void toggleAutoMessage()} disabled={savingFlag} style={savingFlag ? styles.muted : undefined}>
          <SecondaryActionLabel>
            {savingFlag ? 'Saving...' : client.do_not_auto_message ? 'Allow Auto-Messages' : 'Set Do Not Auto-Message'}
          </SecondaryActionLabel>
        </Pressable>
      </Card>

      <Card>
        <SectionTitle>Treatment History</SectionTitle>
        {detail.treatments.length === 0 ? <SupportText>No treatments recorded yet.</SupportText> : null}
        {detail.treatments.slice(0, 8).map((treatment) => (
          <View key={treatment.id} style={styles.historyItem}>
            <Text style={styles.historyTitle}>{treatment.service_name}</Text>
            <SupportText>{new Date(treatment.performed_at).toLocaleDateString()} | {treatment.stage.replaceAll('_', ' ')}</SupportText>
            {treatment.notes ? <BodyText>{treatment.notes}</BodyText> : null}
          </View>
        ))}
        <TextInput value={service} onChangeText={setService} placeholder="Add treatment/service" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Pressable onPress={() => void saveTreatment()} disabled={!service.trim()}><SecondaryActionLabel>Add Treatment</SecondaryActionLabel></Pressable>
      </Card>

      <Link href={{ pathname: '/media/import', params: { clientId: id, role: 'other' } }} asChild>
        <Pressable><SecondaryActionLabel>Add Client Photos / Media</SecondaryActionLabel></Pressable>
      </Link>

      <Card>
        <SectionTitle>Notes</SectionTitle>
        {detail.notes.length === 0 ? <SupportText>No notes yet.</SupportText> : null}
        {detail.notes.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <BodyText>{item.content}</BodyText>
            <SupportText>{item.note_type} | {new Date(item.created_at).toLocaleDateString()}</SupportText>
          </View>
        ))}
        <TextInput value={note} onChangeText={setNote} placeholder="Add a client note" placeholderTextColor={ui.colors.secondaryText} multiline style={[styles.input, styles.multiline]} />
        <Pressable onPress={() => void saveNote()} disabled={!note.trim()}><SecondaryActionLabel>Add Note</SecondaryActionLabel></Pressable>
      </Card>

      <Card>
        <SectionTitle>Consent & Marketing</SectionTitle>
        {detail.consents.length === 0 ? <SupportText>No consent records yet.</SupportText> : detail.consents.slice(0, 5).map((consent) => (
          <BodyText key={consent.id}>{consent.consent_type.replaceAll('_', ' ')}: {consent.status}</BodyText>
        ))}
        {/* Consent records could be read but never created from the app. Each type records
            granted or withdrawn; the API appends a record rather than overwriting, so the
            history stays auditable. */}
        <SupportText>Record consent</SupportText>
        {CONSENT_TYPES.map((type) => (
          <View key={type} style={styles.consentRow}>
            <BodyText>{type.replaceAll('_', ' ')}</BodyText>
            <View style={styles.consentActions}>
              <Pressable onPress={() => void saveConsent(type, 'granted')} disabled={savingConsent !== null} style={savingConsent !== null ? styles.muted : undefined}>
                <SecondaryActionLabel>{savingConsent === type ? '...' : 'Granted'}</SecondaryActionLabel>
              </Pressable>
              <Pressable onPress={() => void saveConsent(type, 'withdrawn')} disabled={savingConsent !== null} style={savingConsent !== null ? styles.muted : undefined}>
                <SecondaryActionLabel>Withdrawn</SecondaryActionLabel>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>Payments & Follow-ups</SectionTitle>
        {detail.payments.length === 0 ? <SupportText>No payment entries yet.</SupportText> : detail.payments.slice(0, 8).map((payment) => (
          <View key={payment.id} style={styles.historyItem}>
            <BodyText>{payment.entry_type.replaceAll('_', ' ')} | {payment.currency} {Number(payment.amount).toLocaleString()}</BodyText>
            <SupportText>{payment.method ?? 'other'} | {new Date(payment.occurred_at).toLocaleDateString()}</SupportText>
          </View>
        ))}
        <SupportText>Quick record actual money received. Booked price does not count as income.</SupportText>
        <TextInput value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="Amount actually received" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <TextInput value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Payment method (cash, bank, etc.)" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Pressable onPress={() => void savePayment()} disabled={!paymentAmount.trim() || savingPayment}><PrimaryActionLabel>{savingPayment ? 'Recording...' : 'Record Received Payment'}</PrimaryActionLabel></Pressable>
        {detail.followups.length ? detail.followups.slice(0, 5).map((followup) => <BodyText key={followup.id}>{followup.reason} | {followup.status}</BodyText>) : <SupportText>No follow-ups yet.</SupportText>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: ui.colors.softGold,
    backgroundColor: ui.colors.elevated,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: ui.colors.gold, fontWeight: '700', fontSize: 20 },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  aiLink: { color: ui.colors.gold, fontSize: 14, fontWeight: '700', paddingVertical: ui.spacing.xs },
  historyItem: { borderTopWidth: 1, borderTopColor: ui.colors.border, paddingTop: ui.spacing.xs, gap: 3 },
  historyTitle: { color: ui.colors.primaryText, fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    padding: ui.spacing.sm,
    fontSize: 15,
    textAlignVertical: 'top'
  },
  multiline: { minHeight: 78 },
  muted: { opacity: 0.55 },
  consentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm, paddingVertical: ui.spacing.xs },
  consentActions: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.md }
});
