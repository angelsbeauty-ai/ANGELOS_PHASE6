import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    { name: 'Clients', route: '/clients' },
    { name: 'Calendar', route: '/calendar' },
    { name: 'Messages', route: '/messages' },
    { name: 'Content', route: '/content' },
    { name: 'Assistant', route: '/ai' },
    { name: 'Approvals', route: '/approvals' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AngelOS</Text>
        <Text style={styles.subtitle}>Business OS · V1</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.route}
            style={styles.card}
            onPress={() => router.push(feature.route as never)}
          >
            <LinearGradient colors={['#0ea5e920', '#0ea5e910']} style={styles.cardGradient}>
              <Text style={styles.cardName}>{feature.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>For any business owner. Hermes is not in this app.</Text>
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
  cardName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', textAlign: 'center' },
  footer: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 16 },
  footerText: { fontSize: 12, color: '#64748b', textAlign: 'center' },
});
