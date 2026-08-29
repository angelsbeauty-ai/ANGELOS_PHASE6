import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../../src/components/ui';
import { createContentDraft, reviewContentMedia, type ContentObjective, type ContentPlatform, type ContentReview } from '../../src/lib/content';
import { getActiveWorkspace } from '../../src/lib/workspace';

const objectives: ContentObjective[] = ['bookings','reach','inquiries','saves','education','trust','availability'];
const platforms: ContentPlatform[] = ['instagram','facebook','tiktok','manual'];

export default function NewContentScreen() {
  const [objective, setObjective] = useState<ContentObjective>('bookings'); const [title, setTitle] = useState('Next recommended post');
  const [goal, setGoal] = useState(''); const [review, setReview] = useState<ContentReview | null>(null); const [selected, setSelected] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<ContentPlatform[]>(['instagram']); const [busy, setBusy] = useState(false);
  async function reviewMedia() { setBusy(true); try { const workspace = await getActiveWorkspace(); const result = await reviewContentMedia(workspace.id, objective); setReview(result); setSelected(result.recommendation?.mediaAssetIds ?? []); } catch (error) { Alert.alert('Could not review media', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  function togglePlatform(platform: ContentPlatform) { setSelectedPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]); }
  async function create() { if (!selected.length) return Alert.alert('Choose media', 'Review your eligible media first.'); if (!selectedPlatforms.length) return Alert.alert('Choose a platform', 'Choose at least one platform version.'); setBusy(true); try { const workspace = await getActiveWorkspace(); const post = await createContentDraft(workspace.id, { title, objective, goal, mediaAssetIds: selected, platforms: selectedPlatforms }); router.replace(`/content/${post.id}` as any); } catch (error) { Alert.alert('Could not create content', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }

  return <Screen>
    <Pill tone="gold">Guided Creation</Pill><ScreenTitle>Create Content</ScreenTitle><SupportText>Choose the business result. AngelOS will recommend one strongest eligible media direction.</SupportText>
    <Card><SectionTitle>1. Choose the goal</SectionTitle><View style={styles.wrap}>{objectives.map((item) => <Pressable key={item} onPress={() => { setObjective(item); setReview(null); }}><Pill tone={item === objective ? 'gold' : 'secondary'}>{item.replaceAll('_', ' ')}</Pill></Pressable>)}</View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Post title" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
      <TextInput value={goal} onChangeText={setGoal} placeholder="Optional details about what you want to achieve" placeholderTextColor={ui.colors.secondaryText} style={[styles.input, styles.goalInput]} multiline />
    </Card>
    <Card premium><SectionTitle>2. Let AngelOS review</SectionTitle><SupportText>Only media eligible for this business goal will be considered.</SupportText><Pressable onPress={() => void reviewMedia()} disabled={busy}><PrimaryActionLabel>{busy ? 'Reviewing...' : 'Review My Media'}</PrimaryActionLabel></Pressable></Card>
    {review?.recommendation ? <Card><View style={styles.recommendationHeader}><Pill tone="gold">Recommended</Pill><SupportText>{review.recommendation.format}</SupportText></View><SectionTitle>Strongest direction</SectionTitle><BodyText>{review.recommendation.reason}</BodyText><SupportText>{review.recommendation.mediaAssetIds.length} selected asset(s) | {review.reviewMode === 'ai_vision' ? 'AI visual review' : 'safe metadata review'}</SupportText></Card> : null}
    {review && !review.recommendation ? <Card><BodyText>{review.reason ?? 'No eligible recommendation yet.'}</BodyText></Card> : null}
    {review?.candidates?.length ? <Card><SectionTitle>Eligible media</SectionTitle>{review.candidates.slice(0, 5).map((item) => <View key={item.id} style={styles.candidateRow}><View style={styles.candidateCopy}><Text style={styles.filename}>{item.filename}</Text><SupportText>{item.role}</SupportText></View><Pill>{`score ${item.score}`}</Pill></View>)}</Card> : null}
    <Card><SectionTitle>3. Prepare platform versions</SectionTitle><View style={styles.wrap}>{platforms.map((item) => <Pressable key={item} onPress={() => togglePlatform(item)}><Pill tone={selectedPlatforms.includes(item) ? 'gold' : 'secondary'}>{item}</Pill></Pressable>)}</View><SupportText>Manual is the safe demo transport. Social versions remain drafts until real provider connections are ready.</SupportText></Card>
    <Pressable onPress={() => void create()} disabled={busy}><PrimaryActionLabel>Create Strongest Draft</PrimaryActionLabel></Pressable>
    <Pressable onPress={() => router.back()}><SecondaryActionLabel>Cancel</SecondaryActionLabel></Pressable>
  </Screen>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: ui.spacing.xs }, input: { borderWidth: 1, borderColor: ui.colors.border, borderRadius: ui.radius.control, backgroundColor: ui.colors.elevated, color: ui.colors.primaryText, padding: ui.spacing.sm, fontSize: 16 }, goalInput: { minHeight: 96, textAlignVertical: 'top' },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm }, candidateRow: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.sm, paddingVertical: ui.spacing.xs, borderBottomWidth: 1, borderBottomColor: ui.colors.border }, candidateCopy: { flex: 1, gap: 2 }, filename: { color: ui.colors.primaryText, fontSize: 15, fontWeight: '700' }
});
