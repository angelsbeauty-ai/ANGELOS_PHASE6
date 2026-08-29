import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, StatCard, SupportText, ui } from '../../src/components/ui';
import { getMediaViewUrl, listMedia, type MediaAsset } from '../../src/lib/media';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function MediaLibraryScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null); const [assets, setAssets] = useState<MediaAsset[]>([]); const [previews, setPreviews] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(true);
  useEffect(() => { void load(); }, []);
  async function load() { setBusy(true); try { const workspace = workspaceId ? { id: workspaceId } : await getActiveWorkspace(); if (!workspaceId) setWorkspaceId(workspace.id); const rows = await listMedia(workspace.id); setAssets(rows); const imageRows = rows.filter((row) => row.media_type === 'image' && row.upload_status === 'uploaded').slice(0, 24); const urls = await Promise.all(imageRows.map(async (row) => [row.id, (await getMediaViewUrl(workspace.id, row.id)).url] as const)); setPreviews(Object.fromEntries(urls)); } catch (error) { Alert.alert('Could not load media', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  const approvedCount = assets.filter((asset) => asset.marketing_permission === 'marketing_approved').length;

  return <Screen>
    <View style={styles.header}><View style={styles.headerCopy}><Pill tone="gold">Secure Library</Pill><ScreenTitle>Media</ScreenTitle><SupportText>Your photos, videos and business assets in one calm workspace.</SupportText></View><Link href="/media/import" asChild><Pressable style={styles.importButton}><PrimaryActionLabel>Import</PrimaryActionLabel></Pressable></Link></View>
    <Card premium><SectionTitle>Business copies, safely kept</SectionTitle><BodyText>Import from your phone once. AngelOS preserves the business copy without changing the original on your device.</BodyText></Card>
    <View style={styles.summaryRow}><StatCard label="Total assets" value={String(assets.length)} detail="Secure business copies" /><StatCard label="Marketing ready" value={String(approvedCount)} detail="Approved for use" /></View>
    <View style={styles.libraryHeader}><SectionTitle>Your library</SectionTitle><Pressable onPress={() => void load()} style={styles.refreshButton}><SecondaryActionLabel>Refresh</SecondaryActionLabel></Pressable></View>
    {busy ? <Card><BodyText>Loading media...</BodyText></Card> : null}
    {!busy && assets.length === 0 ? <Card><SectionTitle>No media yet</SectionTitle><SupportText>Import from Photos or take a new business photo to begin.</SupportText></Card> : null}
    <View style={styles.grid}>{assets.map((asset) => <View key={asset.id} style={styles.assetCard}>
      {asset.media_type === 'image' && previews[asset.id] ? <Image source={{ uri: previews[asset.id] }} style={styles.preview} /> : <View style={styles.placeholder}><Pill>{asset.media_type === 'video' ? 'Video' : 'File'}</Pill></View>}
      <View style={styles.assetCopy}><Text numberOfLines={1} style={styles.filename}>{asset.original_filename}</Text><SupportText>{asset.links?.[0]?.client?.display_name ?? 'Not linked'}</SupportText><Pill tone={asset.marketing_permission === 'marketing_approved' ? 'success' : asset.marketing_permission === 'private' ? 'critical' : 'secondary'}>{asset.marketing_permission.replaceAll('_', ' ')}</Pill></View>
    </View>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm }, headerCopy: { flex: 1, gap: ui.spacing.xs }, importButton: { width: 104 }, summaryRow: { flexDirection: 'row', gap: ui.spacing.sm },
  libraryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm }, refreshButton: { width: 104 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: ui.spacing.sm }, assetCard: { width: '47.5%', overflow: 'hidden', borderWidth: 1, borderColor: ui.colors.border, borderRadius: ui.radius.card, backgroundColor: ui.colors.elevated },
  preview: { width: '100%', aspectRatio: 1 }, placeholder: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.warmSurface }, assetCopy: { gap: ui.spacing.xs, padding: ui.spacing.sm }, filename: { color: ui.colors.primaryText, fontSize: 14, fontWeight: '700' }
});
