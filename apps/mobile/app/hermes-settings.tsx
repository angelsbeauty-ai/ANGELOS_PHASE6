import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HermesSettingsScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [avatarSize, setAvatarSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleResetTutorial = async () => {
    await AsyncStorage.setItem('hermes_tutorial_seen', 'false');
    alert('Tutorial will show again on next voice session');
  };

  const handleSave = async () => {
    await AsyncStorage.multiSet([
      ['hermes_language', language],
      ['hermes_avatar_size', avatarSize],
      ['hermes_haptics', String(hapticsEnabled)],
    ]);
    alert('Settings saved!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hermes Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, language === 'ja' && styles.optionActive]}
            onPress={() => setLanguage('ja')}
          >
            <Text style={[styles.optionText, language === 'ja' && styles.optionTextActive]}>日本語</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, language === 'en' && styles.optionActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatar Size</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, avatarSize === 'small' && styles.optionActive]}
            onPress={() => setAvatarSize('small')}
          >
            <Text style={[styles.optionText, avatarSize === 'small' && styles.optionTextActive]}>Small</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, avatarSize === 'medium' && styles.optionActive]}
            onPress={() => setAvatarSize('medium')}
          >
            <Text style={[styles.optionText, avatarSize === 'medium' && styles.optionTextActive]}>Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, avatarSize === 'large' && styles.optionActive]}
            onPress={() => setAvatarSize('large')}
          >
            <Text style={[styles.optionText, avatarSize === 'large' && styles.optionTextActive]}>Large</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Haptic Feedback</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable vibration on tap</Text>
          <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleResetTutorial}>
        <Text style={styles.resetButtonText}>Reset Tutorial</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, padding: 14, backgroundColor: '#222', borderRadius: 10, alignItems: 'center' },
  optionActive: { backgroundColor: '#0a0' },
  optionText: { fontSize: 14, color: '#ccc' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: 14, borderRadius: 10 },
  switchLabel: { fontSize: 14, color: '#ccc' },
  resetButton: { backgroundColor: '#a00', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  resetButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveButton: { backgroundColor: '#0a0', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backButton: { backgroundColor: '#333', padding: 16, borderRadius: 10, alignItems: 'center' },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
