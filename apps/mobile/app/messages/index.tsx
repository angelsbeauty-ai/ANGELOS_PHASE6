import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
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
import { createDemoMessagingChannel, ingestDemoMessage, listMessageThreads, listMessagingChannels, type MessageThreadSummary } from '../../src/lib/messaging';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function MessagesScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      setWorkspaceId(workspace.id);
      setThreads(await listMessageThreads(workspace.id));
    } catch (error) {
      Alert.alert('Could not load messages', error instanceof Error ? error.message : 'Unknown error');
    } finally { setBusy(false); }
  }

  async function addDemoInquiry() {
    if (!workspaceId) return;
    try {
      let channels = await listMessagingChannels(workspaceId);
      let channel = channels.find((item) => item.provider === 'manual');
      if (!channel) channel = await createDemoMessagingChannel(workspaceId);
      const result = await ingestDemoMessage(workspaceId, channel.id, 'Hi! Are you available Saturday afternoon for brows?');
      await load();
      router.push(`/messages/${result.threadId}` as any);
    } catch (error) {
      Alert.alert('Could not create demo inquiry', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return <Screen>
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Pill tone="gold">Smart Inbox</Pill>
        <ScreenTitle>Messages</ScreenTitle>
        <SupportText>Review client conversations, AI drafts, translations and booking handoff in one place.</SupportText>
      </View>
      <Pressable onPress={() => void load()} style={styles.refreshButton}>
        <SecondaryActionLabel>Refresh</SecondaryActionLabel>
      </Pressable>
    </View>

    <Card premium>
      <SectionTitle>Receptionist Mode</SectionTitle>
      <BodyText>Live Meta, LINE and TikTok connections plug into this inbox later. Demo Inbox lets us test the workflow safely now.</BodyText>
      <Pressable onPress={() => void addDemoInquiry()} style={styles.actionLink}>
        <PrimaryActionLabel>Create Demo Inquiry</PrimaryActionLabel>
      </Pressable>
    </Card>

    <Link href="/messages/review" asChild>
      <Pressable>
        <Card>
          <SectionTitle>Client Draft Review</SectionTitle>
          <SupportText>Review staged AI drafts, translations and analysis. Approving a draft keeps sending locked.</SupportText>
          <PrimaryActionLabel>Open Draft Review</PrimaryActionLabel>
        </Card>
      </Pressable>
    </Link>

    {busy ? <Card><BodyText>Loading messages...</BodyText></Card> : null}
    {!busy && threads.length === 0 ? (
      <Card>
        <SectionTitle>No conversations yet</SectionTitle>
        <SupportText>When a client inquiry arrives, AngelOS will show the priority, intent and next action here.</SupportText>
      </Card>
    ) : null}

    <View style={styles.threadList}>
      {threads.map((thread) => (
        <Link key={thread.id} href={`/messages/${thread.id}` as any} asChild>
          <Pressable>
            <Card>
              <View style={styles.threadHeader}>
                <View style={styles.threadTitle}>
                  <Text style={styles.itemTitle}>{thread.client?.display_name ?? thread.contact_display_name ?? 'Unknown sender'}</Text>
                  <SupportText>{thread.channel?.display_name ?? 'Channel'} | {thread.intent.replaceAll('_', ' ')}</SupportText>
                </View>
                <Pill tone={thread.priority === 'urgent' ? 'critical' : thread.priority === 'today' ? 'warning' : 'secondary'}>
                  {thread.priority}
                </Pill>
              </View>
              <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
                <BodyText>{thread.status.replaceAll('_', ' ')}</BodyText>
                <SupportText tone={thread.needs_owner ? 'warning' : 'secondary'}>
                  {thread.needs_owner ? 'Needs owner review' : 'No owner action needed'}
                </SupportText>
              </Row>
            </Card>
          </Pressable>
        </Link>
      ))}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  refreshButton: { width: 104 },
  actionLink: { marginTop: ui.spacing.xs },
  threadList: { gap: ui.spacing.sm },
  threadHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  threadTitle: { flex: 1, gap: 2 },
  itemTitle: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' },
  chevron: { color: ui.colors.gold, fontSize: 24, lineHeight: 26 }
});
