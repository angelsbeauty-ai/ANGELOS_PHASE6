import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText } from '../../src/components/ui';
import { importMedia } from '../../src/lib/media';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function ImportMediaScreen() {
  const router = useRouter(); const params = useLocalSearchParams<{ clientId?: string; role?: string }>(); const [busy, setBusy] = useState(false);
  async function pickFromPhotos() { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { Alert.alert('Photos permission needed', 'AngelOS only needs Photos access when you choose to import business media. You can keep using the rest of the app without it.'); return; } const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 20, quality: 1 }); if (result.canceled) return; setBusy(true); try { const workspace = await getActiveWorkspace(); for (const selected of result.assets) { const filename = selected.fileName || `angelos_${Date.now()}.${selected.type === 'video' ? 'mp4' : 'jpg'}`; const mimeType = selected.mimeType || (selected.type === 'video' ? 'video/mp4' : 'image/jpeg'); await importMedia(workspace.id, { uri: selected.uri, filename, mimeType, sizeBytes: selected.fileSize, width: selected.width, height: selected.height, durationMs: selected.duration ?? undefined, source: 'phone_photos' }, { clientId: params.clientId, role: params.role ?? 'other', marketingPermission: 'unknown' }); } Alert.alert('Saved to AngelOS', `${result.assets.length} item${result.assets.length === 1 ? '' : 's'} securely imported.`); router.back(); } catch (error) { Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }
  async function takePhoto() { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) { Alert.alert('Camera permission needed', 'AngelOS only asks for Camera access when you choose to capture business media.'); return; } const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 }); if (result.canceled) return; setBusy(true); try { const workspace = await getActiveWorkspace(); const selected = result.assets[0]; await importMedia(workspace.id, { uri: selected.uri, filename: selected.fileName || `camera_${Date.now()}.jpg`, mimeType: selected.mimeType || 'image/jpeg', sizeBytes: selected.fileSize, width: selected.width, height: selected.height, source: 'camera' }, { clientId: params.clientId, role: params.role ?? 'other', marketingPermission: 'unknown' }); Alert.alert('Saved to AngelOS', 'The photo is now part of the secure business library.'); router.back(); } catch (error) { Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } }

  return <Screen>
    <Pill tone="gold">Secure Import</Pill><ScreenTitle>Add Media</ScreenTitle><SupportText>Choose what you already have. No extra account or folder setup is required.</SupportText>
    {params.clientId ? <Card premium><SectionTitle>Linked to this client</SectionTitle><BodyText>New media will be attached to the client record you came from.</BodyText></Card> : null}
    <Card><SectionTitle>Choose from Photos</SectionTitle><SupportText>Select up to 20 photos or videos already on your phone.</SupportText><Pressable disabled={busy} onPress={() => void pickFromPhotos()}><PrimaryActionLabel>{busy ? 'Saving...' : 'Choose From Photos'}</PrimaryActionLabel></Pressable></Card>
    <Card><SectionTitle>Capture something new</SectionTitle><SupportText>Take a business photo and save it directly into AngelOS.</SupportText><Pressable disabled={busy} onPress={() => void takePhoto()}><SecondaryActionLabel>Take a Photo</SecondaryActionLabel></Pressable></Card>
    <Card premium><SectionTitle>Your original stays yours</SectionTitle><SupportText>AngelOS preserves only what you intentionally import. The original on your phone is not changed.</SupportText></Card>
    <Pressable onPress={() => router.back()} disabled={busy}><SecondaryActionLabel>Cancel</SecondaryActionLabel></Pressable>
  </Screen>;
}
