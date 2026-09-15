import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    { name: 'Hermes Voice', icon: '🤖', route: '/hermes-voice' },
    { name: 'AI Settings', icon: '🧠', route: '/ai-settings' },
    { name: 'Approvals', icon: '✅', route: '/approvals' },
    { name: 'History', icon: '📋', route: '/hermes-history' },
    { name: 'Settings', icon: '⚙️', route: '/hermes-settings' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AngelOs</Text>
        <Text style={styles.subtitle}>AI Operating System</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => router.push(feature.route as any)}
          >
            <LinearGradient colors={['#0ea5e920', '#0ea5e910']} style={styles.cardGradient}>
              <Text style={styles.cardIcon}>{feature.icon}</Text>
              <Text style={styles.cardName}>{feature.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Built for Angels Beauty Academy</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16 },
  card: { width: '48%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  cardGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardIcon: { fontSize: 42, marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', textAlign: 'center' },
  footer: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 16 },
  footerText: { fontSize: 12, color: '#64748b', textAlign: 'center' },
});
