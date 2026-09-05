import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
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
} from '../../src/components/ui';
import { addThreadInternalNote, approveAndSendMessage, createAiReplyDraft, createMessageReply, getMessageThread, translateClientMessage, type MessageThreadDetail } from '../../src/lib/messaging';
import { getAssistantProfile } from '../../src/lib/ai';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MessageThreadDetail | null>(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (id) void load(); }, [id]);
  async function load() {
    if (!id) return;
    setBusy(true);
    try {
      const workspace = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
      if (!workspaceId) setWorkspaceId(workspace.id);
      setDetail(await getMessageThread(workspace.id, id));
    } catch (error) { Alert.alert('Could not load conversation', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setBusy(false); }
  }

  const latestPendingAi = useMemo(() => detail?.messages.slice().reverse().find((m) => m.sender_type === 'ai' && m.status === 'pending_approval') ?? null, [detail]);
  const latestInbound = useMemo(() => detail?.messages.slice().reverse().find((m) => m.direction === 'inbound') ?? null, [detail]);
  const transportConnected = detail?.thread.channel?.provider === 'manual';

  async function draftWithAi() {
    if (!workspaceId || !id) return;
    try { const result = await createAiReplyDraft(workspaceId, id); setReply(result.message.body); await load(); }
    catch (error) { Alert.alert('Could not draft reply', error instanceof Error ? error.message : 'Unknown error'); }
  }

  async function translateLatestInbound() {
    if (!workspaceId || !latestInbound) return;
    try {
      const profile = await getAssistantProfile(workspaceId);
      await translateClientMessage(workspaceId, latestInbound.id, profile.profile.primary_language || 'en');
      await load();
    } catch (error) { Alert.alert('Could not translate', error instanceof Error ? error.message : 'Unknown error'); }
  }

  async function saveOrSendOwnerReply() {
    if (!workspaceId || !id || !reply.trim()) return;
    try {
      await createMessageReply(workspaceId, id, reply.trim(), transportConnected);
      if (!transportConnected) {
        Alert.alert('Draft saved', 'This channel is visible in AngelOS, but live outbound transport is not connected yet. Nothing was sent to the client.');
      }
      setReply('');
      await load();
    } catch (error) { Alert.alert(transportConnected ? 'Could not send' : 'Could not save draft', error instanceof Error ? error.message : 'Unknown error'); }
  }

  async function approveAiDraft() {
    if (!workspaceId || !latestPendingAi) return;
    if (!transportConnected) {
      Alert.alert('Live send not connected', 'Approval can be reviewed here, but this channel does not yet have a verified outbound transport. Nothing was sent.');
      return;
    }
    try { await approveAndSendMessage(workspaceId, latestPendingAi.id); setReply(''); await load(); }
    catch (error) { Alert.alert('Could not send AI draft', error instanceof Error ? error.message : 'Unknown error'); }
  }

  async function saveNote() {
    if (!workspaceId || !id || !note.trim()) return;
    try { await addThreadInternalNote(workspaceId, id, note.trim()); setNote(''); await load(); }
    catch (error) { Alert.alert('Could not save note', error instanceof Error ? error.message : 'Unknown error'); }
  }

  if (busy && !detail) return <Screen><Card><BodyText>Loading conversation...</BodyText></Card></Screen>;
  if (!detail) return <Screen><Card><BodyText>Conversation not found.</BodyText></Card></Screen>;
  const title = detail.thread.client?.display_name ?? detail.thread.contact_display_name ?? 'Conversation';

  return <Screen>
    <Card premium>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Pill tone={detail.thread.needs_owner ? 'warning' : 'gold'}>
            {detail.thread.needs_owner ? 'Needs owner review' : 'Conversation'}
          </Pill>
          <ScreenTitle>{title}</ScreenTitle>
          <SupportText>{detail.thread.intent.replaceAll('_', ' ')} | {detail.thread.status.replaceAll('_', ' ')}</SupportText>
        </View>
        <Link href={{ pathname: '/ai', params: { screen: 'messages', entityType: 'message_thread', entityId: detail.thread.id, entityLabel: title } }} style={styles.aiLink}>Ask AI</Link>
      </View>
    </Card>

    {!transportConnected ? (
      <Card>
        <Pill tone="warning">Outbound locked</Pill>
        <SectionTitle>{detail.thread.channel?.display_name ?? 'Channel'} is read/control only</SectionTitle>
        <SupportText>AngelOS can show the conversation, create drafts, translate, and save notes. Live outbound transport for this channel is not verified yet, so send actions stay locked and nothing is presented as sent.</SupportText>
      </Card>
    ) : null}

    {(detail.thread.intent === 'booking' || detail.thread.intent === 'reschedule') ? (
      <Link href={{ pathname: '/calendar', params: { focusLabel: `Checking availability for ${title}`, messageThreadId: detail.thread.id } }} asChild>
        <Pressable>
          <Card>
            <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
              <SectionTitle>Check Calendar</SectionTitle>
              <SupportText>Use this conversation while checking availability.</SupportText>
            </Row>
          </Card>
        </Pressable>
      </Link>
    ) : null}

    <View style={styles.messages}>
      {detail.messages.map((message) => (
        <View key={message.id} style={[styles.messageWrap, message.direction === 'outbound' ? styles.outbound : styles.inbound]}>
          <Card premium={message.sender_type === 'ai'}>
            <Pill tone={message.sender_type === 'ai' ? 'gold' : message.sensitive ? 'warning' : 'secondary'}>
              {message.sender_type}
            </Pill>
            <BodyText>{message.body}</BodyText>
            {message.translated_body ? (
              <View style={styles.translationBox}>
                <SupportText tone="gold">Translation</SupportText>
                <BodyText>{message.translated_body}</BodyText>
              </View>
            ) : null}
            <SupportText>{message.status}{message.sensitive ? ' | sensitive' : ''}</SupportText>
          </Card>
        </View>
      ))}
    </View>

    <Card>
      <SectionTitle>Reply Control</SectionTitle>
      <View style={styles.actionButtons}>
        {latestInbound ? (
          <Pressable onPress={() => void translateLatestInbound()} style={styles.actionButton}>
            <SecondaryActionLabel>Translate Latest</SecondaryActionLabel>
          </Pressable>
        ) : null}
        <Pressable onPress={() => void draftWithAi()} style={styles.actionButton}>
          <SecondaryActionLabel>AI Draft Reply</SecondaryActionLabel>
        </Pressable>
      </View>
      <TextInput
        value={reply}
        onChangeText={setReply}
        placeholder="Write or edit reply"
        placeholderTextColor={ui.colors.secondaryText}
        multiline
        style={styles.input}
      />
      {latestPendingAi ? (
        <Pressable onPress={() => void approveAiDraft()} disabled={!transportConnected} style={[styles.primaryAction, !transportConnected && styles.disabledAction]}>
          <PrimaryActionLabel>{transportConnected ? 'Approve AI Draft & Send' : 'Approve & Send Locked'}</PrimaryActionLabel>
        </Pressable>
      ) : null}
      <Pressable onPress={() => void saveOrSendOwnerReply()} disabled={!reply.trim()} style={styles.primaryAction}>
        <SecondaryActionLabel>{transportConnected ? 'Send As Owner' : 'Save Owner Draft'}</SecondaryActionLabel>
      </Pressable>
    </Card>

    <Card>
      <SectionTitle>Private Internal Note</SectionTitle>
      <SupportText>Only visible inside AngelOS. Never sent to the client.</SupportText>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Add context for yourself or the AI"
        placeholderTextColor={ui.colors.secondaryText}
        multiline
        style={styles.input}
      />
      <Pressable onPress={() => void saveNote()} disabled={!note.trim()} style={styles.primaryAction}>
        <SecondaryActionLabel>Save Note</SecondaryActionLabel>
      </Pressable>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  aiLink: { color: ui.colors.gold, fontSize: 14, fontWeight: '700', paddingVertical: ui.spacing.xs },
  chevron: { color: ui.colors.gold, fontSize: 24, lineHeight: 26 },
  messages: { gap: ui.spacing.sm },
  messageWrap: { maxWidth: '94%' },
  inbound: { alignSelf: 'flex-start' },
  outbound: { alignSelf: 'flex-end' },
  translationBox: {
    gap: 2,
    padding: ui.spacing.sm,
    borderRadius: ui.radius.control,
    borderWidth: 1,
    borderColor: ui.colors.softGold,
    backgroundColor: ui.colors.background
  },
  actionButtons: { flexDirection: 'row', gap: ui.spacing.sm },
  actionButton: { flex: 1 },
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
  primaryAction: { marginTop: ui.spacing.xs },
  disabledAction: { opacity: 0.45 }
});