import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AISettingsScreen() {
  const router = useRouter();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [voiceMode, setVoiceMode] = useState('hermes');

  const handleSave = async () => {
    try {
      await AsyncStorage.multiSet([
        ['ai_enabled', String(aiEnabled)],
        ['ai_auto_suggestions', String(autoSuggestions)],
        ['ai_voice_mode', voiceMode],
      ]);
      alert('Settings saved!');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Assistant</Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Enable AI</Text>
          <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ false: '#334155', true: '#0ea5e9' }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Auto Suggestions</Text>
          <Switch value={autoSuggestions} onValueChange={setAutoSuggestions} trackColor={{ false: '#334155', true: '#0ea5e9' }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Mode</Text>
        
        <TouchableOpacity
          style={[styles.option, voiceMode === 'hermes' && styles.optionActive]}
          onPress={() => setVoiceMode('hermes')}
        >
          <Text style={[styles.optionText, voiceMode === 'hermes' && styles.optionTextActive]}>Hermes (Local)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, voiceMode === 'cloud' && styles.optionActive]}
          onPress={() => setVoiceMode('cloud')}
        >
          <Text style={[styles.optionText, voiceMode === 'cloud' && styles.optionTextActive]}>Cloud AI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          AngelOs uses AI to help with:
        </Text>
        <Text style={styles.bulletText}>• Booking appointments</Text>
        <Text style={styles.bulletText}>• Client messaging</Text>
        <Text style={styles.bulletText}>• Content creation</Text>
        <Text style={styles.bulletText}>• Business insights</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  backButton: { fontSize: 28, color: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '600', color: '#f1f5f9' },
  placeholder: { width: 28 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#94a3b8', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  label: { fontSize: 15, color: '#f1f5f9' },
  option: { backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  optionActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  optionText: { fontSize: 15, color: '#f1f5f9' },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  bulletText: { fontSize: 14, color: '#f1f5f9', marginBottom: 6, marginLeft: 8 },
  saveButton: { backgroundColor: '#0ea5e9', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
