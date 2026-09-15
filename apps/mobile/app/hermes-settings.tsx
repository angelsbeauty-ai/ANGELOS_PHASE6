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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language / 言語</Text>
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
            <Text style={[styles.optionText, avatarSize === 'small' && styles.optionTextActive]}>S</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, avatarSize === 'medium' && styles.optionActive]}
            onPress={() => setAvatarSize('medium')}
          >
            <Text style={[styles.optionText, avatarSize === 'medium' && styles.optionTextActive]}>M</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, avatarSize === 'large' && styles.optionActive]}
            onPress={() => setAvatarSize('large')}
          >
            <Text style={[styles.optionText, avatarSize === 'large' && styles.optionTextActive]}>L</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Haptic Feedback</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable vibration on tap</Text>
          <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ false: '#333', true: '#0a0' }} />
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleResetTutorial}>
        <Text style={styles.resetButtonText}>Reset Tutorial</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#121212', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  backButton: { fontSize: 28, color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  placeholder: { width: 28 },
  section: { marginBottom: 24, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#aaa', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, padding: 14, backgroundColor: '#1e1e1e', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  optionActive: { backgroundColor: '#0a0', borderColor: '#0a0' },
  optionText: { fontSize: 15, color: '#ccc' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  switchLabel: { fontSize: 15, color: '#ccc' },
  resetButton: { backgroundColor: '#2a1a1a', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#a00' },
  resetButtonText: { color: '#f44', fontSize: 16, fontWeight: '700' },
  saveButton: { backgroundColor: '#0a0', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
