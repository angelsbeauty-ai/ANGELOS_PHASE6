import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HermesOnboardingScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🤖</Text>
        <Text style={styles.title}>Talk to Hermes</Text>
        <Text style={styles.subtitle}>Your AI assistant for AngelOs</Text>
      </View>

      <View style={styles.features}>
        <Feature title="Voice first" desc="Speak naturally in Japanese. Hermes listens and replies by voice." />
        <Feature title="Remembers you" desc="Hermes recalls past conversations so you don't have to repeat yourself." />
        <Feature title="Draggable avatar" desc="Move Hermes around the screen. Tap to interact." />
        <Feature title="Always available" desc="Tap once and start talking anytime you need help." />
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/hermes-voice')}
      >
        <Text style={styles.startButtonText}>Start voice session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push('/hermes-history')}
      >
        <Text style={styles.historyButtonText}>View conversation history</Text>
      </TouchableOpacity>

      <Text style={styles.muted}>This demo uses on-device speech recognition and LiveKit real-time voice.</Text>
    </ScrollView>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  hero: { alignItems: 'center', marginVertical: 24 },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  features: { marginVertical: 16 },
  feature: { marginBottom: 16, padding: 14, backgroundColor: '#f7f7f7', borderRadius: 10 },
  featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#444' },
  startButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  historyButtonText: { color: '#000', fontSize: 15, fontWeight: '600' },
  muted: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 16 },
});
