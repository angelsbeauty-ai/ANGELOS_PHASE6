import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, Row, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { getFounderMe } from '../src/lib/founder';
import { supabase } from '../src/lib/supabase';

const areas = [
  { href: '/ai-settings', title: 'AI Assistant', detail: 'Personality, roles, proactivity and guidance' },
  { href: '/marketing-profile', title: 'Marketing Profile', detail: 'Goals, ideal client, experience and service area' },
  { href: '/subscription', title: 'Subscription', detail: 'Plan, student discount and account access' },
  { href: '/system-health', title: 'System Health', detail: 'Connections, Needs Attention and emergency controls' }
] as const;

export default function SettingsScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    const { data } = await supabase.auth.getSession();
    setEmail(data.session?.user.email ?? null);
    try {
      const me = await getFounderMe();
      setIsFounder(me.founder);
    } catch {
      setIsFounder(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return <Screen>
    <Pill tone="gold">Owner Control</Pill><ScreenTitle>Settings</ScreenTitle><SupportText>Keep AngelOS aligned with how you work and how much control you want.</SupportText>
    <Card premium><SectionTitle>Calm by default</SectionTitle><BodyText>Business-changing actions still follow approval and safety rules. Settings shape your experience without weakening workspace protection.</BodyText></Card>
    <Card><SectionTitle>Workspace settings</SectionTitle><View>{areas.map((area) => <Link key={area.href} href={area.href} asChild><Pressable><Row accessory={<Text style={styles.chevron}>{'>'}</Text>}><BodyText>{area.title}</BodyText><SupportText>{area.detail}</SupportText></Row></Pressable></Link>)}</View></Card>
    {isFounder ? <Card><SectionTitle>Founder controls</SectionTitle><Link href="/founder-admin" asChild><Pressable><Row accessory={<Text style={styles.chevron}>{'>'}</Text>}><BodyText>Founder Control Center</BodyText><SupportText>Platform rollout, beta access and launch safety controls</SupportText></Row></Pressable></Link></Card> : null}
    <Card><SectionTitle>Account</SectionTitle><BodyText>{email ?? 'Signed in on this device'}</BodyText><Pressable onPress={() => void signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable></Card>
  </Screen>;
}
const styles = StyleSheet.create({
  chevron:{color:ui.colors.gold,fontSize:26,lineHeight:28},
  signOut:{marginTop:ui.spacing.sm,borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,paddingVertical:12,paddingHorizontal:ui.spacing.sm,alignItems:'center',backgroundColor:ui.colors.elevated},
  signOutText:{color:ui.colors.primaryText,fontSize:15,fontWeight:'700'}
});
