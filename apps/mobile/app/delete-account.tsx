import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, PrimaryActionLabel, ScreenTitle, SupportText } from '../src/components/ui';
import { submitBetaFeedback } from '../src/lib/beta';
import { supabase } from '../src/lib/supabase';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function DeleteAccountScreen() {
  const [busy, setBusy] = useState(false);

  async function requestDelete() {
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      await submitBetaFeedback(workspace.id, {
        category: 'support',
        message: 'ACCOUNT_DELETION_REQUEST. Delete this login and workspace data I control. I confirm this from the in-app Delete my account screen.',
        permissionToContact: true
      });
      await supabase.auth.signOut();
      Alert.alert('Deletion requested', 'We received it. The account is signed out. Data we control is removed within 30 days.');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Could not send deletion request', error instanceof Error ? error.message : 'Try again from a signed-in workspace.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenTitle>Delete my account</ScreenTitle>
      <SupportText>Apple requires this inside the app. This is not a cancel-subscription button.</SupportText>
      <Card>
        <BodyText>This asks AngelOS to delete your login and the workspace data we control. Messages already sent on LINE, Instagram, or Facebook stay on those networks. Tax records, if any, can be kept where the law requires.</BodyText>
      </Card>
      <Pressable disabled={busy} onPress={() => void requestDelete()}>
        <PrimaryActionLabel>{busy ? 'Sending...' : 'Delete my account'}</PrimaryActionLabel>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.cancel}>Keep my account</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cancel: { color: '#a1a1aa', fontSize: 15, fontWeight: '700', textAlign: 'center', paddingVertical: 12 }
});
