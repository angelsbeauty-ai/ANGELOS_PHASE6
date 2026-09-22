import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { apiFetch } from '../src/lib/api';
import { getBetaAccess, redeemBetaInvite, type BetaAccess } from '../src/lib/beta';

type Workspace = { id: string; name: string; timezone: string; currency: string; locale: string };

export default function OnboardingScreen() {
  const router = useRouter();
  const device = useMemo(() => {
    const options = Intl.DateTimeFormat().resolvedOptions();
    return { locale: options.locale, timezone: options.timeZone };
  }, []);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [invite, setInvite] = useState('');
  const [access, setAccess] = useState<BetaAccess | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => { void loadAccess(); }, []);
  async function loadAccess() { try { setAccess(await getBetaAccess()); } catch { setAccess(null); } finally { setChecking(false); } }
  async function redeem() {
    if (!invite.trim()) return;
    setSaving(true);
    try { const result = await redeemBetaInvite(invite.trim()); setAccess(result); setInvite(''); Alert.alert('Beta access approved', 'You can now create your AngelOS business workspace.'); }
    catch (error) { Alert.alert('Invite could not be redeemed', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setSaving(false); }
  }
  async function createWorkspace() {
    const nextCurrency = currency.trim().toUpperCase();
    if (!name.trim() || nextCurrency.length !== 3) return;
    setSaving(true);
    try {
      const workspace = await apiFetch<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify({ name: name.trim(), businessType: 'beauty', timezone: device.timezone, currency: nextCurrency, locale: device.locale }) });
      Alert.alert('Workspace created', workspace.name + ' is ready. Next: add services and open hours so bookings can work.', [{ text: 'Set up services', onPress: () => router.replace('/services') }, { text: 'Later', style: 'cancel' }]);
    } catch (error) { Alert.alert('Could not create workspace', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setSaving(false); }
  }

  if (checking) return <Screen><View style={styles.stack}><Pill tone="gold">Private Beta</Pill><ScreenTitle>Preparing your setup</ScreenTitle><Card><BodyText>Checking beta access...</BodyText></Card></View></Screen>;
  if (!access?.approved) return <Screen><View style={styles.stack}>
    <Pill tone="gold">Founder-Approved Access</Pill>
    <ScreenTitle>Welcome to AngelOS</ScreenTitle>
    <SupportText>A calm operating system for your beauty business. Your first workspace stays private and owner-controlled.</SupportText>
    <Card premium><SectionTitle>Enter your private invite</SectionTitle><BodyText>Create your account first, then use the invite shared with you by the Founder.</BodyText><View style={styles.field}><Text style={styles.label}>Beta invite</Text><TextInput value={invite} onChangeText={setInvite} placeholder="Private invite token" placeholderTextColor={ui.colors.secondaryText} autoCapitalize="none" autoCorrect={false} style={styles.input}/></View><Pressable disabled={saving || !invite.trim()} onPress={() => void redeem()} style={({ pressed }) => [styles.action, (pressed || saving || !invite.trim()) && styles.muted]}><PrimaryActionLabel>{saving ? 'Checking...' : 'Verify Invite'}</PrimaryActionLabel></Pressable></Card>
    <Card><SectionTitle>What setup asks for</SectionTitle><SupportText>Only your business name and regional settings. Calendar, contacts, photos and messaging permissions are requested later窶俳nly when you use those features.</SupportText></Card>
  </View></Screen>;

  return <Screen><View style={styles.stack}>
    <Pill tone="success">{access.founderBypass ? 'Founder Access Verified' : 'Beta Access Verified'}</Pill>
    <ScreenTitle>Create your workspace</ScreenTitle>
    <SupportText>One focused setup now. AngelOS can guide the rest after your business workspace is ready.</SupportText>
    <Card premium><Pill tone="gold">Step 1 of 2</Pill><SectionTitle>Your business</SectionTitle><View style={styles.field}><Text style={styles.label}>Business name</Text><TextInput value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor={ui.colors.secondaryText} autoCapitalize="words" style={styles.input}/></View><View style={styles.field}><View style={styles.labelRow}><Text style={styles.label}>Currency</Text><SupportText>3-letter code</SupportText></View><TextInput value={currency} onChangeText={setCurrency} placeholder="JPY" placeholderTextColor={ui.colors.secondaryText} autoCapitalize="characters" maxLength={3} style={styles.input}/></View></Card>
    <Card><SectionTitle>Suggested from this device</SectionTitle><View style={styles.detailRow}><SupportText>Language and locale</SupportText><Text style={styles.detailValue}>{device.locale}</Text></View><View style={styles.detailRow}><SupportText>Time zone</SupportText><Text style={styles.detailValue}>{device.timezone}</Text></View><SupportText>These settings keep appointments and prices clear. You can review them later in Settings.</SupportText></Card>
    <Card><SectionTitle>Owner-controlled by default</SectionTitle><SupportText>This creates one main business workspace with you as its owner. AngelOS will not invent services, prices, availability or business hours.</SupportText></Card>
    <Pressable onPress={() => void createWorkspace()} disabled={saving || !name.trim() || currency.trim().length !== 3} style={({ pressed }) => [styles.action, (pressed || saving || !name.trim() || currency.trim().length !== 3) && styles.muted]}><PrimaryActionLabel>{saving ? 'Creating...' : 'Create Workspace'}</PrimaryActionLabel></Pressable>
  </View></Screen>;
}

const styles = StyleSheet.create({ stack:{gap:ui.spacing.md},field:{gap:ui.spacing.xs},labelRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:ui.spacing.sm},label:{color:ui.colors.primaryText,fontSize:13,fontWeight:'700'},input:{minHeight:52,borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,paddingHorizontal:ui.spacing.sm,color:ui.colors.primaryText,backgroundColor:ui.colors.elevated,fontSize:16},action:{borderRadius:ui.radius.control},muted:{opacity:.55},detailRow:{minHeight:42,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:ui.spacing.sm,borderBottomWidth:1,borderBottomColor:ui.colors.border},detailValue:{color:ui.colors.primaryText,fontSize:14,fontWeight:'700',flexShrink:1,textAlign:'right'} });
