import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../../src/components/ui';
import { approveContentPost, getContentPost, publishContentVariant, scheduleContentVariant, updateContentVariant, type ContentPost, type ContentVariant } from '../../src/lib/content';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [workspaceId, setWorkspaceId] = useState<string | null>(null); const [post, setPost] = useState<ContentPost | null>(null);
  const [scheduleByVariant, setScheduleByVariant] = useState<Record<string,string>>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (id) void load(); }, [id]);
  async function load() { try { const workspace = await getActiveWorkspace(); setWorkspaceId(workspace.id); setPost(await getContentPost(workspace.id, id)); } catch (error) { Alert.alert('Could not load content', error instanceof Error ? error.message : 'Unknown error'); } }
  async function saveVariant(variant: ContentVariant, field: 'caption'|'hook'|'cta', value: string) { if (!workspaceId) return; try { await updateContentVariant(workspaceId, variant.id, { [field]: value }); await load(); } catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error'); } }
  async function approve() { if (!workspaceId) return; setBusy(true); try { await approveContentPost(workspaceId, id); await load(); } catch (error) { Alert.alert('Could not approve', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  async function schedule(variant: ContentVariant) { if (!workspaceId) return; const value = scheduleByVariant[variant.id]; if (!value) return Alert.alert('Add a date/time', 'Use an ISO date/time with timezone, for example 2026-08-22T19:00:00+09:00.'); try { await scheduleContentVariant(workspaceId, variant.id, value); await load(); } catch (error) { Alert.alert('Could not schedule', error instanceof Error ? error.message : 'Unknown error'); } }
  async function publish(variant: ContentVariant) { if (!workspaceId) return; setBusy(true); try { const result = await publishContentVariant(workspaceId, variant.id); Alert.alert('Published', result.duplicatePrevented ? 'Duplicate publish prevented; this version was already verified.' : 'Demo publishing was verified.'); await load(); } catch (error) { Alert.alert('Publishing stopped', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  if (!post) return <Screen><Card><BodyText>Loading content...</BodyText></Card></Screen>;

  return <Screen>
    <View style={styles.titleRow}><View style={styles.titleCopy}><Pill tone="gold">Content Plan</Pill><ScreenTitle>{post.title}</ScreenTitle></View><Pill>{post.status.replaceAll('_', ' ')}</Pill></View>
    <SupportText>{post.primary_format} | {post.objective.replaceAll('_',' ')}</SupportText>
    <Card premium><SectionTitle>Why this direction</SectionTitle><BodyText>{post.strategy_reason ?? 'No strategy note yet.'}</BodyText></Card>
    {post.media?.length ? <Card><SectionTitle>Selected media</SectionTitle>{post.media.map((item) => <View key={item.id} style={styles.mediaRow}><Pill>{`${item.position + 1}`}</Pill><View style={styles.mediaCopy}><Text style={styles.mediaName}>{item.asset.original_filename}</Text><SupportText>{item.role}</SupportText></View></View>)}</Card> : null}
    {post.variants?.map((variant) => <Card key={variant.id}>
      <View style={styles.variantHeader}><Pill tone="gold">{variant.platform}</Pill><Pill>{variant.status}</Pill></View>
      <SectionTitle>{variant.format} version</SectionTitle>
      <Text style={styles.label}>Hook</Text><TextInput defaultValue={variant.hook ?? ''} onEndEditing={(event) => void saveVariant(variant, 'hook', event.nativeEvent.text)} placeholderTextColor={ui.colors.secondaryText} style={styles.input}/>
      <Text style={styles.label}>Caption</Text><TextInput defaultValue={variant.caption} multiline onEndEditing={(event) => void saveVariant(variant, 'caption', event.nativeEvent.text)} placeholderTextColor={ui.colors.secondaryText} style={[styles.input, styles.caption]}/>
      <Text style={styles.label}>Call to action</Text><TextInput defaultValue={variant.cta ?? ''} onEndEditing={(event) => void saveVariant(variant, 'cta', event.nativeEvent.text)} placeholderTextColor={ui.colors.secondaryText} style={styles.input}/>
      <SupportText>{variant.hashtags.join(' ')}</SupportText>
      <TextInput value={scheduleByVariant[variant.id] ?? variant.scheduled_for ?? ''} onChangeText={(value) => setScheduleByVariant((current) => ({...current,[variant.id]:value}))} placeholder="Schedule: 2026-08-22T19:00:00+09:00" placeholderTextColor={ui.colors.secondaryText} style={styles.input}/>
      <Pressable onPress={() => void schedule(variant)}><SecondaryActionLabel>Schedule This Version</SecondaryActionLabel></Pressable>
      {variant.platform === 'manual' ? <Pressable onPress={() => void publish(variant)}><SecondaryActionLabel>Publish With Safe Demo</SecondaryActionLabel></Pressable> : <SupportText>Live {variant.platform} publishing unlocks after provider account and capability checks are connected.</SupportText>}
    </Card>)}
    {post.status === 'prepared' || post.status === 'draft' ? <Pressable onPress={() => void approve()} disabled={busy}><PrimaryActionLabel>{busy ? 'Approving...' : 'Approve Post'}</PrimaryActionLabel></Pressable> : null}
    <Pressable onPress={() => router.push({ pathname: '/ai', params: { contextEntityType: 'content_post', contextEntityId: post.id, contextScreen: 'content' } } as any)}><SecondaryActionLabel>Ask AI About This Post</SecondaryActionLabel></Pressable>
  </Screen>;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm }, titleCopy: { flex: 1, gap: ui.spacing.xs }, variantHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.sm, paddingVertical: ui.spacing.xs }, mediaCopy: { flex: 1, gap: 2 }, mediaName: { color: ui.colors.primaryText, fontSize: 15, fontWeight: '700' }, label: { color: ui.colors.primaryText, fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: ui.colors.border, borderRadius: ui.radius.control, backgroundColor: ui.colors.elevated, color: ui.colors.primaryText, padding: ui.spacing.sm, fontSize: 15 }, caption: { minHeight: 128, textAlignVertical: 'top' }
});
