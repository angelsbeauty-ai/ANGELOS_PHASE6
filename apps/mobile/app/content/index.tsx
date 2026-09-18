import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../../src/components/ui';
import { listContent, type ContentPost } from '../../src/lib/content';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function ContentScreen() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => { void load(); }, []);

  async function load() {
    setBusy(true);
    try { const workspace = await getActiveWorkspace(); setPosts(await listContent(workspace.id)); }
    catch (error) { Alert.alert('Could not load content', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={styles.header}>
      <View style={styles.headerCopy}><Pill tone="gold">Marketing Studio</Pill><ScreenTitle>Content</ScreenTitle><SupportText>Draft, approve, schedule. Publish only after a connected account and your OK.</SupportText></View>
      <Link href="/content/new" asChild><Pressable style={styles.createButton}><PrimaryActionLabel>Create</PrimaryActionLabel></Pressable></Link>
    </View>
    <Card premium>
      <SectionTitle>Schedule a month (C + D)</SectionTitle>
      <BodyText>Pick a time on a draft, approve, then it waits to publish. Academy trainees get 1 month of scheduling free.</BodyText>
      <SupportText>Live posting needs Instagram or LINE connected first.</SupportText>
      <Link href="/connections" asChild><Pressable style={{ marginTop: 8 }}><SecondaryActionLabel>Connect accounts</SecondaryActionLabel></Pressable></Link>
    </Card>
    <View style={styles.sectionHeader}><SectionTitle>Your content</SectionTitle><Pressable onPress={() => void load()} style={styles.refreshButton}><SecondaryActionLabel>Refresh</SecondaryActionLabel></Pressable></View>
    {busy ? <Card><BodyText>Loading content...</BodyText></Card> : null}
    {!busy && posts.length === 0 ? <Card><SectionTitle>No drafts yet</SectionTitle><SupportText>Start with a business goal and AngelOS will review your eligible media.</SupportText></Card> : null}
    {posts.map((post) => <Link key={post.id} href={`/content/${post.id}` as never} asChild><Pressable><Card>
      <View style={styles.postHeader}><Pill tone={post.status === 'published' ? 'success' : post.status === 'failed' ? 'critical' : 'secondary'}>{post.status.replaceAll('_', ' ')}</Pill><SupportText>{post.primary_format}</SupportText></View>
      <Text style={styles.postTitle}>{post.title}</Text><SupportText>{post.objective.replaceAll('_', ' ')}</SupportText>
      <BodyText>{post.strategy_reason ?? 'Strategy note will appear after the media review.'}</BodyText>
    </Card></Pressable></Link>)}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm }, headerCopy: { flex: 1, gap: ui.spacing.xs }, createButton: { width: 104 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm }, refreshButton: { width: 104 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm }, postTitle: { color: ui.colors.primaryText, fontSize: 18, fontWeight: '700' }
});
