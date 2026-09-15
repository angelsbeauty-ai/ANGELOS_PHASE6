import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    { name: 'Hermes Voice', icon: '🤖', route: '/hermes-voice', color: ['#0a0', '#0a0'] },
    { name: 'Planner', icon: '📅', route: '/hermes-planner', color: ['#00a', '#00a'] },
    { name: 'History', icon: '📋', route: '/hermes-history', color: ['#a0a', '#a0a'] },
    { name: 'Settings', icon: '⚙️', route: '/hermes-settings', color: ['#666', '#888'] },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1a']} style={styles.header}>
        <Text style={styles.title}>AngelOs</Text>
        <Text style={styles.subtitle}>Your AI Operating System</Text>
      </LinearGradient>

      <View style={styles.grid}>
        {features.map((feature, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => router.push(feature.route as any)}
          >
            <LinearGradient colors={feature.color} style={styles.cardGradient}>
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
  container: { flexGrow: 1, backgroundColor: '#121212' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16 },
  card: { width: '48%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  cardGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  cardIcon: { fontSize: 42, marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center' },
  footer: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222' },
  footerText: { fontSize: 12, color: '#666' },
});
