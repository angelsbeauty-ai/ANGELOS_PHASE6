import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card, Pill, PrimaryActionLabel, ScreenTitle, SupportText, ui } from '../../src/components/ui';
import { createClient } from '../../src/lib/clients';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function NewClientScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      const client = await createClient(workspace.id, {
        displayName: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        language: language.trim() || 'en',
        status: 'lead'
      });
      router.replace({ pathname: '/clients/[id]', params: { id: client.id } });
    } catch (error) {
      Alert.alert('Could not create client', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pill tone="gold">Quick Record</Pill>
      <ScreenTitle>New Client</ScreenTitle>
      <SupportText>Start with what you know. AngelOS can complete the profile over time.</SupportText>

      <Card>
        <TextInput value={name} onChangeText={setName} placeholder="Client name" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={ui.colors.secondaryText} keyboardType="phone-pad" style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email (optional)" placeholderTextColor={ui.colors.secondaryText} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput value={language} onChangeText={setLanguage} placeholder="Language, e.g. en / ja" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
      </Card>

      <Pressable disabled={busy || !name.trim()} onPress={() => void save()}>
        <PrimaryActionLabel>{busy ? 'Saving...' : 'Create Client'}</PrimaryActionLabel>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    padding: ui.spacing.sm,
    fontSize: 16
  }
});
