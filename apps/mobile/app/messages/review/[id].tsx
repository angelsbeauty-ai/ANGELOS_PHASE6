import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
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
} from '../../../src/components/ui';
import {
  getClientControlReviewDetail,
  reviewClientControlDraft,
  type ClientControlReviewDecision,
  type ClientControlReviewDetail
} from '../../../src/lib/messaging';
import { getActiveWorkspace } from '../../../src/lib/workspace';

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (value === null || value === undefined || value === '') return 'Not stated';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).replaceAll('_', ' ');
}

export default function ClientControlDraftReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientControlReviewDetail | null>(null);
  const [japaneseReply, setJapaneseReply] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) void load(); }, [id]);

  async function load() {
    if (!id) return;
    setBusy(true);
    try {
      const workspace = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
      if (!workspaceId) setWorkspaceId(workspace.id);
      const next = await getClientControlReviewDetail(workspace.id, id);
      setDetail(next);
      setJapaneseReply(next.draft.suggested_reply);
      setEnglishMeaning(next.draft.english_meaning);
    } catch (error) {
      Alert.alert('Could not load staged draft', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function review(decision: ClientControlReviewDecision) {
    if (!workspaceId || !id) return;
    const hasUnsavedEdits = detail
      && (japaneseReply.trim() !== detail.draft.suggested_reply.trim()
        || englishMeaning.trim() !== detail.draft.english_meaning.trim());
    if (decision === 'approve' && hasUnsavedEdits) {
      Alert.alert('Save your edit first', 'Use “Save edit — reapproval required” before approving this staged draft.');
      return;
    }
    setSaving(true);
    try {
      await reviewClientControlDraft(workspaceId, id, {
        decision,
        editedBody: decision === 'edit' ? japaneseReply : undefined,
        englishMeaning: decision === 'edit' ? englishMeaning : undefined,
        reason: reason.trim() || undefined
      });
      setReason('');
      await load();
      Alert.alert(
        decision === 'approve' ? 'Approved — sending stays locked' : decision === 'edit' ? 'Edit saved for reapproval' : 'Draft rejected',
        'This staging review does not send anything to the client.'
      );
    } catch (error) {
      Alert.alert('Could not record review', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  if (busy && !detail) return <Screen><Card><BodyText>Loading staged draft...</BodyText></Card></Screen>;
  if (!detail) return <Screen><Card><BodyText>Staged draft not found.</BodyText></Card></Screen>;

  const analysis = detail.draft.analysis;
  const recentMessages = detail.client_context.recent_messages ?? [];
  const appointments = detail.client_context.recent_appointments ?? [];

  return (
    <Screen>
      <Card premium>
        <Pill tone="gold">No-send staging</Pill>
        <ScreenTitle>{detail.client?.display_name ?? 'Client draft review'}</ScreenTitle>
        <SupportText>Status: {detail.draft.review_status.replaceAll('_', ' ')} · Sending remains locked</SupportText>
      </Card>

      <Card>
        <SectionTitle>Original client message</SectionTitle>
        <BodyText>{detail.source_message?.original_body ?? 'Original message is unavailable.'}</BodyText>
        <SupportText>Detected language: {detail.source_message?.original_language ?? analysis.detected_language}</SupportText>
        <SupportText>English meaning: {detail.source_message?.english_meaning ?? analysis.client_message_english_meaning}</SupportText>
      </Card>

      <Card>
        <SectionTitle>Client context</SectionTitle>
        <SupportText>{detail.client?.display_name ?? 'No CRM identity linked'} · {detail.client?.language ?? 'unknown'} · {detail.client?.status ?? 'needs identity review'}</SupportText>
        <SupportText>Thread: {detail.thread.intent.replaceAll('_', ' ')} · {detail.thread.priority} · {detail.thread.needs_owner ? 'Needs Angel' : 'No owner flag'}</SupportText>
        {appointments.map((appointment, index) => (
          <BodyText key={appointment.start_at + '-' + index}>{appointment.service_name} · {appointment.status} · {appointment.start_at}</BodyText>
        ))}
        {recentMessages.slice(-3).map((message) => (
          <SupportText key={message.id}>{message.direction}: {message.body}</SupportText>
        ))}
      </Card>

      <Card>
        <SectionTitle>AI analysis</SectionTitle>
        {Object.entries(analysis).map(([key, value]) => (
          <SupportText key={key}>{key.replaceAll('_', ' ')}: {formatValue(value)}</SupportText>
        ))}
      </Card>

      <Card>
        <SectionTitle>Suggested Japanese reply</SectionTitle>
        <TextInput
          value={japaneseReply}
          onChangeText={setJapaneseReply}
          multiline
          editable={!saving}
          placeholder="Suggested Japanese reply"
          placeholderTextColor={ui.colors.secondaryText}
          style={styles.input}
        />
        <SectionTitle>English meaning of reply</SectionTitle>
        <TextInput
          value={englishMeaning}
          onChangeText={setEnglishMeaning}
          multiline
          editable={!saving}
          placeholder="English meaning"
          placeholderTextColor={ui.colors.secondaryText}
          style={styles.input}
        />
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          editable={!saving}
          placeholder="Optional note for the audit record"
          placeholderTextColor={ui.colors.secondaryText}
          style={styles.input}
        />
        <Pressable disabled={saving} onPress={() => void review('approve')} style={styles.action}>
          <PrimaryActionLabel>Approve — sending stays locked</PrimaryActionLabel>
        </Pressable>
        <Pressable disabled={saving} onPress={() => void review('edit')} style={styles.action}>
          <SecondaryActionLabel>Save edit — reapproval required</SecondaryActionLabel>
        </Pressable>
        <Pressable disabled={saving} onPress={() => void review('reject')} style={styles.action}>
          <SecondaryActionLabel>Reject draft</SecondaryActionLabel>
        </Pressable>
      </Card>

      <Card>
        <SectionTitle>Audit history</SectionTitle>
        {detail.audit_history.length === 0 ? <SupportText>No review events recorded yet.</SupportText> : null}
        {detail.audit_history.map((event, index) => (
          <SupportText key={event.created_at + '-' + index}>
            {event.event_type} · {event.actor_type} · {event.created_at}
          </SupportText>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    fontSize: 16,
    lineHeight: 22,
    padding: ui.spacing.sm,
    textAlignVertical: 'top'
  },
  action: { marginTop: ui.spacing.xs }
});
