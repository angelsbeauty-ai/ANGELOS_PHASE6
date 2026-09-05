import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, StatCard, SupportText, ui } from '../src/components/ui';
import { getAnalyticsOverview, runMarketingCoach, type AnalyticsOverview } from '../src/lib/analytics';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function AnalyticsScreen() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null); const [coach, setCoach] = useState<string | null>(null); const [busy, setBusy] = useState(true); const [coachBusy, setCoachBusy] = useState(false);
  useEffect(() => { void load(); }, []);
  async function load() { setBusy(true); try { const workspace = await getActiveWorkspace(); setOverview(await getAnalyticsOverview(workspace.id, 30)); } catch (error) { Alert.alert('Could not load analytics', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  async function askCoach() { setCoachBusy(true); try { const workspace = await getActiveWorkspace(); const result = await runMarketingCoach(workspace.id, 30); setCoach(result.recommendation); setOverview(result.evidence); } catch (error) { Alert.alert('Marketing Coach unavailable', error instanceof Error ? error.message : 'Unknown error'); } finally { setCoachBusy(false); } }
  const totals = overview?.totals;

  return <Screen>
    <View style={styles.header}><View style={styles.headerCopy}><Pill tone="gold">Last 30 Days</Pill><ScreenTitle>Analytics</ScreenTitle><SupportText>Business outcomes first—then one clear next move.</SupportText></View><Pressable onPress={() => void load()} style={styles.refresh}><SecondaryActionLabel>Refresh</SecondaryActionLabel></Pressable></View>
    {busy ? <Card><BodyText>Loading analytics...</BodyText></Card> : null}
    {overview ? <>
      <View style={styles.grid}><StatCard label="Views" value={metric(totals?.views)} detail="Measured reach"/><StatCard label="Saves" value={metric(totals?.saves)} detail="Intent signal"/></View>
      <View style={styles.grid}><StatCard label="Inquiries" value={metric(totals?.inquiries)} detail="Qualified interest"/><StatCard label="Bookings" value={metric(totals?.bookings)} detail="Business result"/></View>
      <Card premium><View style={styles.cardHeader}><SectionTitle>Evidence quality</SectionTitle><Pill tone={overview.evidence.ownedDataConfidence === 'high' ? 'success' : overview.evidence.ownedDataConfidence === 'low' ? 'warning' : 'gold'}>{overview.evidence.ownedDataConfidence} confidence</Pill></View><SupportText>{overview.evidence.measuredVariants} measured post{overview.evidence.measuredVariants === 1 ? '' : 's'} | {overview.evidence.audienceActivitySamples} audience activity sample{overview.evidence.audienceActivitySamples === 1 ? '' : 's'}</SupportText></Card>
      <Card><SectionTitle>Best posting window</SectionTitle>{overview.postingWindow.label ? <><Text style={styles.featureValue}>{overview.postingWindow.label}</Text><SupportText>{overview.postingWindow.confidence} confidence from available evidence.</SupportText></> : <SupportText>{overview.postingWindow.message ?? 'Not enough data yet.'}</SupportText>}</Card>
      <Card><SectionTitle>Strongest measured post</SectionTitle>{overview.topPost ? <><Text style={styles.featureValue}>{overview.topPost.title}</Text><SupportText>{overview.topPost.platform} | {overview.topPost.format}</SupportText><BodyText>AngelOS ranks business outcomes above vanity metrics.</BodyText></> : <SupportText>No post has enough recorded metrics yet. AngelOS will learn as analytics sync arrives.</SupportText>}</Card>
      <Card premium><Pill tone="gold">Marketing Coach</Pill><SectionTitle>What should I do next?</SectionTitle><SupportText>Your measured results come first. Limited evidence is clearly identified.</SupportText>{coach ? <BodyText>{coach}</BodyText> : null}<Pressable disabled={coachBusy} onPress={() => void askCoach()}><PrimaryActionLabel>{coachBusy ? 'Reviewing...' : 'Give Me One Next Move'}</PrimaryActionLabel></Pressable></Card>
      <Card><SectionTitle>Operating costs</SectionTitle>{overview.operatingCosts?.planPrice ? <BodyText>Plan price: {new Intl.NumberFormat(undefined, { style: 'currency', currency: overview.operatingCosts.planPrice.currency }).format(overview.operatingCosts.planPrice.amountCents / 100)} / {overview.operatingCosts.planPrice.interval === 'yearly' ? 'year' : 'month'}</BodyText> : <SupportText>Plan price is unavailable.</SupportText>}<SupportText>{overview.operatingCosts?.explanation ?? 'Actual provider costs are not measured yet.'}</SupportText><Link href="/subscription" style={styles.link}>View subscription details</Link></Card>
      <Card><SectionTitle>Marketing context</SectionTitle><SupportText>Set your growth goal, ideal client, experience level and service area.</SupportText><Link href="/marketing-profile" style={styles.link}>Edit Marketing Profile</Link></Card>
      <Card><SectionTitle>Local context</SectionTitle><SupportText>Saved service-area context is active. Live events and trends remain unavailable until a current-data provider is connected.</SupportText></Card>
    </> : null}
  </Screen>;
}
function metric(value: number | null | undefined) { return value == null ? '—' : new Intl.NumberFormat().format(value); }
const styles = StyleSheet.create({header:{flexDirection:'row',alignItems:'flex-start',gap:ui.spacing.sm},headerCopy:{flex:1,gap:ui.spacing.xs},refresh:{width:104},grid:{flexDirection:'row',gap:ui.spacing.sm},cardHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:ui.spacing.sm},featureValue:{color:ui.colors.primaryText,fontSize:20,fontWeight:'700'},link:{color:ui.colors.gold,fontSize:15,fontWeight:'700',paddingVertical:ui.spacing.xs}});
