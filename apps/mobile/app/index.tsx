import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const v1 = [
  { name: 'Clients', route: '/clients' },
  { name: 'Calendar', route: '/calendar' },
  { name: 'Messages', route: '/messages' },
  { name: 'Content', route: '/content' },
  { name: 'Assistant', route: '/ai' },
  { name: 'Talk', route: '/hermes-voice' },
  { name: 'Approvals', route: '/approvals' },
  { name: 'Automations', route: '/automations' },
  { name: 'API Access', route: '/api-access' },
  { name: 'Credits', route: '/credits' }
];

const more = [
  { name: 'Bookings', route: '/bookings' },
  { name: 'Analytics', route: '/analytics' },
  { name: 'Finance', route: '/finance' },
  { name: 'Services', route: '/services' },
  { name: 'Media', route: '/media' },
  { name: 'AI Settings', route: '/ai-settings' },
  { name: 'Hermes', route: '/hermes' },
  { name: 'System Check', route: '/system-check' },
  { name: 'System Health', route: '/system-health' },
  { name: 'Settings', route: '/settings' },
  { name: 'Subscription', route: '/subscription' },
  { name: 'Founder', route: '/founder-admin' },
  { name: 'Onboarding', route: '/onboarding' },
  { name: 'Marketing', route: '/marketing-profile' },
  { name: 'Feedback', route: '/beta-feedback' }
];

function Grid({
  items,
  onPress
}: {
  items: { name: string; route: string }[];
  onPress: (route: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {items.map((feature) => (
        <TouchableOpacity key={feature.route} style={styles.card} onPress={() => onPress(feature.route)}>
          <LinearGradient colors={['#0ea5e920', '#0ea5e910']} style={styles.cardGradient}>
            <Text style={styles.cardName}>{feature.name}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const go = (route: string) => router.push(route as never);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AngelOS</Text>
        <Text style={styles.subtitle}>Business OS · V1 · nothing removed</Text>
      </View>

      <Text style={styles.section}>Store app</Text>
      <Grid items={v1} onPress={go} />

      <Text style={styles.section}>All other features</Text>
      <Grid items={more} onPress={go} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Talk needs a native iPhone build, not Expo Go. Set the live server in API Access. Credits shows OpenAI left this month.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', paddingBottom: 32 },
  header: { padding: 40, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  section: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 8,
    textTransform: 'uppercase'
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16 },
  card: { width: '48%', minHeight: 88, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  cardGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', textAlign: 'center' },
  footer: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 8 },
  footerText: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 }
});
