import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HermesVoiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Hermes Voice</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.voiceCard}>
          <FontAwesome name="microphone" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.voiceTitle}>Voice Assistant</Text>
          <Text style={styles.voiceText}>Tap microphone to start recording</Text>
          
          <TouchableOpacity style={styles.micButton}>
            <FontAwesome name="microphone" size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  placeholder: { width: 24 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  voiceCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  voiceTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginTop: 20, marginBottom: 8 },
  voiceText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, textAlign: 'center' },
  micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
});
