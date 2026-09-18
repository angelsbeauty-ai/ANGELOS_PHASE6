import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../src/components/ui';
import {
  connectLine,
  connectMeta,
  defaultExpiryIso,
  disconnectLine,
  disconnectMeta,
  getLineStatus,
  getMetaStatus,
  type LineStatus,
  type MetaStatus
} from '../src/lib/connections';
import { getActiveWorkspace } from '../src/lib/workspace';

function statusLabel(meta: MetaStatus | null, provider: 'instagram' | 'facebook') {
  const row = meta?.connections.find((c) => c.provider === provider);
  if (!row?.tokenPresent) return 'Not connected';
  if (row.expired) return 'Expired — reconnect';
  return row.status === 'connected' ? 'Connected' : row.status;
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [line, setLine] = useState<LineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [igName, setIgName] = useState('');
  const [igId, setIgId] = useState('');
  const [igToken, setIgToken] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineId, setLineId] = useState('');
  const [lineToken, setLineToken] = useState('');

  async function load(id?: string) {
    const workspace = id ?? (await getActiveWorkspace()).id;
    setWorkspaceId(workspace);
    try {
      const [m, l] = await Promise.all([getMetaStatus(workspace), getLineStatus(workspace)]);
      setMeta(m);
      setLine(l);
    } catch (error) {
      Alert.alert('Could not load connections', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onConnectIg() {
    if (!workspaceId || !igName.trim() || !igId.trim() || !igToken.trim()) {
      return Alert.alert('Need name, Instagram account id, and access token');
    }
    setBusy(true);
    try {
      await connectMeta(workspaceId, {
        provider: 'instagram',
        displayName: igName.trim(),
        externalAccountId: igId.trim(),
        accessToken: igToken.trim(),
        accessExpiresAt: defaultExpiryIso()
      });
      setIgToken('');
      await load(workspaceId);
      Alert.alert('Instagram connected', 'Token is stored on the server, not shown again. Real sends stay OFF until you turn the gate on.');
    } catch (error) {
      Alert.alert('Could not connect Instagram', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function onConnectLine() {
    if (!workspaceId || !lineName.trim() || !lineId.trim() || !lineToken.trim()) {
      return Alert.alert('Need name, LINE id, and channel token');
    }
    setBusy(true);
    try {
      await connectLine(workspaceId, {
        displayName: lineName.trim(),
        externalAccountId: lineId.trim(),
        accessToken: lineToken.trim(),
        accessExpiresAt: defaultExpiryIso()
      });
      setLineToken('');
      await load(workspaceId);
      Alert.alert('LINE connected', 'Token is stored on the server. Real sends stay OFF until you turn the gate on.');
    } catch (error) {
      Alert.alert('Could not connect LINE', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  const lineConnected = Boolean(
    (line?.connections ?? []).some((c) => c.tokenPresent && !c.expired)
  );

  return (
    <Screen>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
      <Pill tone="gold">Your accounts</Pill>
      <ScreenTitle>Connect</ScreenTitle>
      <SupportText>
        Like Metricool: hook YOUR Instagram and LINE so AngelOS can draft, schedule, and wait for your approval.
        Nothing messages a real client until a gate is on. One-tap Instagram login needs a Meta app review later — this screen saves your account now.
      </SupportText>

      <Card premium>
        <SectionTitle>Instagram</SectionTitle>
        <Pill tone={statusLabel(meta, 'instagram') === 'Connected' ? 'success' : 'warning'}>
          {statusLabel(meta, 'instagram')}
        </Pill>
        <SupportText>Sends enabled: {meta?.transport.enabled ? 'yes' : 'no (safe default)'} · Meta app: {meta?.appCredentials.configured ? 'yes' : 'not in server yet'}</SupportText>
        <Text style={styles.label}>Display name</Text>
        <TextInput value={igName} onChangeText={setIgName} placeholder="My studio IG" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Text style={styles.label}>Instagram professional account id</Text>
        <TextInput value={igId} onChangeText={setIgId} autoCapitalize="none" placeholder="Graph account id" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Text style={styles.label}>Access token (pasted once, never shown back)</Text>
        <TextInput value={igToken} onChangeText={setIgToken} autoCapitalize="none" secureTextEntry placeholder="IG/Page token" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Pressable disabled={busy} onPress={() => void onConnectIg()}><PrimaryActionLabel>{busy ? 'Working...' : 'Connect Instagram'}</PrimaryActionLabel></Pressable>
        {statusLabel(meta, 'instagram') === 'Connected' && workspaceId ? (
          <Pressable disabled={busy} onPress={() => void disconnectMeta(workspaceId, 'instagram').then(() => load(workspaceId))}>
            <SecondaryActionLabel>Disconnect Instagram</SecondaryActionLabel>
          </Pressable>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>LINE</SectionTitle>
        <Pill tone={lineConnected ? 'success' : 'warning'}>{lineConnected ? 'Connected' : 'Not connected'}</Pill>
        <Text style={styles.label}>Display name</Text>
        <TextInput value={lineName} onChangeText={setLineName} placeholder="Studio LINE" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Text style={styles.label}>LINE user or channel id</Text>
        <TextInput value={lineId} onChangeText={setLineId} autoCapitalize="none" placeholder="LINE id" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Text style={styles.label}>Channel access token (once)</Text>
        <TextInput value={lineToken} onChangeText={setLineToken} autoCapitalize="none" secureTextEntry placeholder="LINE token" placeholderTextColor={ui.colors.secondaryText} style={styles.input} />
        <Pressable disabled={busy} onPress={() => void onConnectLine()}><PrimaryActionLabel>Connect LINE</PrimaryActionLabel></Pressable>
        {lineConnected && workspaceId ? (
          <Pressable disabled={busy} onPress={() => void disconnectLine(workspaceId).then(() => load(workspaceId))}>
            <SecondaryActionLabel>Disconnect LINE</SecondaryActionLabel>
          </Pressable>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Facebook Page</SectionTitle>
        <Pill>{statusLabel(meta, 'facebook')}</Pill>
        <SupportText>Same Meta connect as Instagram. Add after IG works. TikTok, YouTube, LinkedIn, X are not V1.</SupportText>
      </Card>

      <Card premium>
        <SectionTitle>Trainee / student (D)</SectionTitle>
        <BodyText>Academy trainees get 1 month of scheduled posting free. After that, scheduling follows the paid plan. Live publish still needs a connected account + your approval.</BodyText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: ui.colors.gold, fontSize: 16, marginBottom: 8 },
  label: { color: ui.colors.primaryText, fontSize: 13, fontWeight: '700', marginTop: 10 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    paddingHorizontal: ui.spacing.sm,
    color: ui.colors.primaryText,
    backgroundColor: ui.colors.elevated,
    fontSize: 16,
    marginTop: 4
  }
});
