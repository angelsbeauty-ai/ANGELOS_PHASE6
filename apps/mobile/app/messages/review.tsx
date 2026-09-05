import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
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
import { getClientControlReviewQueue, type ClientControlReviewItem } from '../../src/lib/messaging';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function ClientControlReviewQueueScreen() {
  const [items, setItems] = useState<ClientControlReviewItem[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      const queue = await getClientControlReviewQueue(workspace.id);
      setItems(queue.items ?? []);
    } catch (error) {
      Alert.alert('Could not load staged drafts', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Pill tone="gold">No-send staging</Pill>
          <ScreenTitle>Client Draft Review</ScreenTitle>
          <SupportText>Every item needs Angel’s review. Approving a draft records the decision, but cannot send a message.</SupportText>
        </View>
        <Pressable onPress={() => void load()} style={styles.refresh}>
          <SecondaryActionLabel>Refresh</SecondaryActionLabel>
        </Pressable>
      </View>

      <Card premium>
        <SectionTitle>Safety status</SectionTitle>
        <BodyText>LINE Client Control is still staging-only. There is no live LINE intake or send control on this screen.</BodyText>
      </Card>

      {busy ? <Card><BodyText>Loading staged drafts...</BodyText></Card> : null}
      {!busy && items.length === 0 ? (
        <Card>
          <SectionTitle>No staged drafts</SectionTitle>
          <SupportText>When a safe staging test creates a draft, it will appear here for review.</SupportText>
        </Card>
      ) : null}

      <View style={styles.list}>
        {items.map((item) => (
          <Link key={item.draft_message_id} href={('/messages/review/' + item.draft_message_id) as any} asChild>
            <Pressable>
              <Card>
                <View style={styles.row}>
                  <View style={styles.copy}>
                    <Text style={styles.name}>{item.client?.display_name ?? 'Needs identity review'}</Text>
                    <SupportText>{item.analysis.intent.replaceAll('_', ' ')} · {item.analysis.urgency}</SupportText>
                  </View>
                  <Pill tone="warning">{item.review_status.replaceAll('_', ' ')}</Pill>
                </View>
                <Text numberOfLines={3} style={styles.preview}>{item.suggested_reply}</Text>
                <SupportText>English: {item.english_meaning}</SupportText>
              </Card>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  refresh: { width: 104 },
  list: { gap: ui.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  copy: { flex: 1, gap: 2 },
  name: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' },
  preview: { color: ui.colors.primaryText, fontSize: ui.typography.body, lineHeight: 23 }
});
