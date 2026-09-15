import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AngelOs</Text>
      <Text style={styles.subtitle}>Your salon operating system</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Assistant</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/hermes-onboarding')}
        >
          <Text style={styles.cardTitle}>Hermes Voice</Text>
          <Text style={styles.cardDesc}>Talk to Hermes in Japanese. Real-time voice with memory.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More coming soon</Text>
        <Text style={styles.muted}>Additional AngelOs features will appear here.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#444' },
  muted: { fontSize: 14, color: '#888' },
});
