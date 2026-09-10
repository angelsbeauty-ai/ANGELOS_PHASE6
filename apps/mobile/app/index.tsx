import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import {
  AppTitle,
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  Row,
  SecondaryActionLabel,
  SectionTitle,
  StatCard,
  SupportText,
  ui
} from '../src/components/ui';
import { getSystemHealth, type SystemHealthOverview } from '../src/lib/system-health';
import { getActiveWorkspace } from '../src/lib/workspace';
import { supabase } from '../src/lib/supabase';

export default function HomeScreen() {
  const [health, setHealth] = useState<SystemHealthOverview | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const signedIn = Boolean(data.session);
      setIsSignedIn(signedIn);
      setSessionReady(true);
      if (signedIn) {
        void loadHealth();
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const signedIn = Boolean(session);
      setIsSignedIn(signedIn);
      setSessionReady(true);
      if (signedIn) {
        void loadHealth();
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  async function loadHealth() {
    try { const workspace = await getActiveWorkspace(); setHealth(await getSystemHealth(workspace.id)); }
    catch { setHealth(null); }
  }
  if (!sessionReady) {
    return <Screen><SupportText>Loading AngelOS...</SupportText></Screen>;
  }
  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }
  const attentionCount = health ? health.counts.urgent + health.counts.today + health.counts.later : 0;
  return (
    <Screen>
      <View style={styles.hero}>
        <Pill tone="gold">Owner Dashboard</Pill>
        <AppTitle>AngelOS</AppTitle>
        <SupportText>Clients, bookings, content and system health in one calm place.</SupportText>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Appointments" value="Today" detail="Review the day before it starts." />
        <StatCard label="Attention" value={health ? `${attentionCount}` : '--'} detail={health ? 'Items to review' : 'Check workspace health'} />
      </View>

      <Card premium>
        <View style={styles.cardHeader}>
          <SectionTitle>AngelOS Assistant</SectionTitle>
          <Pill>AI ready</Pill>
        </View>
        <BodyText>
          Ask what needs attention, draft a client reply, prepare content, or review today's schedule.
        </BodyText>
        <Link href="/ai" asChild>
          <Pressable style={styles.actionLink}>
            <PrimaryActionLabel>Ask AngelOS</PrimaryActionLabel>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <SectionTitle>Needs Attention</SectionTitle>
        <BodyText>
          {health
            ? attentionCount
              ? `${attentionCount} item${attentionCount === 1 ? '' : 's'} need review before AngelOS acts.`
              : 'Nothing currently needs your attention.'
            : 'Run a System Health check to verify your workspace.'}
        </BodyText>
        <Link href="/system-health" asChild>
          <Pressable style={styles.actionLink}>
            <SecondaryActionLabel>Open System Health</SecondaryActionLabel>
          </Pressable>
        </Link>
      </Card>

      <Card premium>
        <View style={styles.cardHeader}>
          <SectionTitle>Approvals</SectionTitle>
          <Pill tone="gold">Owner only</Pill>
        </View>
        <BodyText>
          Review client replies, content and bookings before AngelOS sends or publishes anything.
        </BodyText>
        <Link href="/approvals" asChild>
          <Pressable style={styles.actionLink}>
            <PrimaryActionLabel>Open Approvals</PrimaryActionLabel>
          </Pressable>
        </Link>
      </Card>

      <Card premium>
        <SectionTitle>Hermes / Planner</SectionTitle>
        <BodyText>Review pending approvals and attention items in one place.</BodyText>
        <Link href="./hermes" asChild>
          <Pressable accessibilityRole="link" style={styles.actionLink}>
            <PrimaryActionLabel>Open Hermes / Planner</PrimaryActionLabel>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <SectionTitle>Run Today</SectionTitle>
        <View>
          <Link href="/calendar" asChild>
            <Pressable style={styles.rowLink}>
              <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
                <BodyText>Calendar</BodyText>
                <SupportText>Bookings, models, classes and conflicts</SupportText>
              </Row>
            </Pressable>
          </Link>
          <Link href="/clients" asChild>
            <Pressable style={styles.rowLink}>
              <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
                <BodyText>Clients</BodyText>
                <SupportText>Profiles, notes and treatment history</SupportText>
              </Row>
            </Pressable>
          </Link>
          <Link href="/messages" asChild>
            <Pressable style={styles.rowLink}>
              <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
                <BodyText>Messages</BodyText>
                <SupportText>Drafts, translation and booking handoff</SupportText>
              </Row>
            </Pressable>
          </Link>
          <Link href="/content" asChild>
            <Pressable style={styles.rowLink}>
              <Row accessory={<Text style={styles.chevron}>{'>'}</Text>}>
                <BodyText>Content</BodyText>
                <SupportText>AI recommendation, approval and publishing</SupportText>
              </Row>
            </Pressable>
          </Link>
        </View>
      </Card>

      <Card>
        <SectionTitle>Tools & Controls</SectionTitle>
        <View style={styles.moreGrid}>
          <Link href="/media" style={styles.moreLink}>Media</Link>
          <Link href="/analytics" style={styles.moreLink}>Analytics</Link>
          <Link href="/finance" style={styles.moreLink}>Finance</Link>
          <Link href="/automations" style={styles.moreLink}>Automations</Link>
          <Link href="/subscription" style={styles.moreLink}>Subscription</Link>
          <Link href="/beta-feedback" style={styles.moreLink}>Feedback</Link>
          <Link href="/settings" style={styles.moreLink}>Settings</Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: ui.spacing.xs
  },
  statsGrid: {
    flexDirection: 'row',
    gap: ui.spacing.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ui.spacing.sm
  },
  actionLink: {
    marginTop: ui.spacing.xs,
  },
  rowLink: {
  },
  chevron: {
    color: ui.colors.gold,
    fontSize: 26,
    lineHeight: 28
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ui.spacing.xs
  },
  moreLink: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: ui.spacing.sm,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.border,
    color: ui.colors.primaryText,
    backgroundColor: ui.colors.elevated,
    fontSize: 14,
    fontWeight: '700',
  }
});
