import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AISettingsScreen() {
  const router = useRouter();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [voiceMode, setVoiceMode] = useState('hermes');

  const handleSave = () => {
    alert('Settings saved!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Assistant</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <FontAwesome name="power" size={18} color="#ffffff" style={styles.icon} />
            <Text style={styles.label}>Enable AI</Text>
          </View>
          <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ false: '#333', true: 'rgba(14,165,233,0.5)' }} thumbColor="#fff" />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <FontAwesome name="bolt" size={18} color="#ffffff" style={styles.icon} />
            <Text style={styles.label}>Auto Suggestions</Text>
          </View>
          <Switch value={autoSuggestions} onValueChange={setAutoSuggestions} trackColor={{ false: '#333', true: 'rgba(14,165,233,0.5)' }} thumbColor="#fff" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Mode</Text>
        
        <TouchableOpacity
          style={[styles.option, voiceMode === 'hermes' && styles.optionActive]}
          onPress={() => setVoiceMode('hermes')}
        >
          <FontAwesome name="microphone" size={18} color="#ffffff" style={styles.optionIcon} />
          <Text style={[styles.optionText, voiceMode === 'hermes' && styles.optionTextActive]}>Hermes (Local)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, voiceMode === 'cloud' && styles.optionActive]}
          onPress={() => setVoiceMode('cloud')}
        >
          <FontAwesome name="cloud" size={18} color="#ffffff" style={styles.optionIcon} />
          <Text style={[styles.optionText, voiceMode === 'cloud' && styles.optionTextActive]}>Cloud AI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color="#ffffff" style={styles.infoIcon} />
          <Text style={styles.infoText}>AngelOs uses AI to help with:</Text>
          <Text style={styles.bulletText}>• Booking appointments</Text>
          <Text style={styles.bulletText}>• Client messaging</Text>
          <Text style={styles.bulletText}>• Content creation</Text>
          <Text style={styles.bulletText}>• Business insights</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <FontAwesome name="check" size={18} color="#ffffff" style={styles.saveIcon} />
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  placeholder: { width: 24 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 12, letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  toggleLabel: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10 },
  label: { fontSize: 14, color: '#ffffff' },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  optionActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 14, color: '#ffffff' },
  optionTextActive: { color: '#ffffff', fontWeight: '600' },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  infoIcon: { marginBottom: 8 },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  bulletText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 6, marginLeft: 8 },
  saveButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  saveIcon: { marginRight: 8 },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
