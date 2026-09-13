import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../src/components/Screen';
import {
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  SecondaryActionLabel,
  ScreenTitle,
  SectionTitle,
  SupportText,
  ui
} from '../src/components/ui';
import {
  connectLineChannel,
  connectMetaChannel,
  disconnectLineChannel,
  disconnectMetaChannel,
  getLineConnectionStatus,
  getMetaConnectionStatus,
  listMessagingChannels,
  type LineConnectionStatus,
  type MessagingChannel,
  type MetaConnectionStatus
} from '../src/lib/messaging';
import { getActiveWorkspace } from '../src/lib/workspace';

function defaultExpiryIso() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString();
}

export default function ConnectionsScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [line, setLine] = useState<LineConnectionStatus | null>(null);
  const [meta, setMeta] = useState<MetaConnectionStatus | null>(null);
  const [channels, setChannels] = useState<MessagingChannel[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  const [igDisplayName, setIgDisplayName] = useState('Angels Beauty Instagram');
  const [igExternalAccountId, setIgExternalAccountId] = useState('');
  const [igAccessToken, setIgAccessToken] = useState('');
  const [igAccessExpiresAt, setIgAccessExpiresAt] = useState(defaultExpiryIso());
  const [igScopes, setIgScopes] = useState('instagram_basic,instagram_manage_messages');

  const [lineDisplayName, setLineDisplayName] = useState('Angels Beauty LINE');
  const [lineExternalAccountId, setLineExternalAccountId] = useState('');
  const [lineAccessToken, setLineAccessToken] = useState('');
  const [lineAccessExpiresAt, setLineAccessExpiresAt] = useState(defaultExpiryIso());

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setBusy(true);
    try {
      const workspace = await getActiveWorkspace();
      setWorkspaceId(workspace.id);
      const [lineStatus, metaStatus, channelRows] = await Promise.all([
        getLineConnectionStatus(workspace.id).catch(() => null),
        getMetaConnectionStatus(workspace.id).catch(() => null),
        listMessagingChannels(workspace.id).catch(() => [])
      ]);
      setLine(lineStatus);
      setMeta(metaStatus);
      setChannels(channelRows);
    } catch (error) {
      Alert.alert('Could not load connections', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  const igConnection = useMemo(
    () => (meta?.connections ?? []).find((row) => row.provider === 'instagram') ?? null,
    [meta]
  );
  const igChannel = useMemo(
    () => (meta?.channels ?? []).find((row) => row.provider === 'instagram') ?? null,
    [meta]
  );
  const igHealthy = Boolean(
    igConnection?.tokenPresent && igConnection.status === 'active' && !igConnection.expired
  );
  const lineHealthy = Boolean(
    line?.connection?.tokenPresent && line.connection.status === 'active' && !line.connection.expired
  );

  async function connectInstagram() {
    if (!workspaceId || saving) return;
    if (!igDisplayName.trim() || !igExternalAccountId.trim() || igAccessToken.trim().length < 20) {
      Alert.alert('Missing details', 'Need display name, Instagram account id, and a long-lived access token.');
      return;
    }
    if (Number.isNaN(Date.parse(igAccessExpiresAt))) {
      Alert.alert('Check expiry', 'Expiry must be a valid ISO date-time.');
      return;
    }
    setSaving(true);
    try {
      const result = await connectMetaChannel(workspaceId, {
        provider: 'instagram',
        displayName: igDisplayName.trim(),
        externalAccountId: igExternalAccountId.trim(),
        accessToken: igAccessToken.trim(),
        accessExpiresAt: new Date(igAccessExpiresAt).toISOString(),
        scopes: igScopes.trim() || undefined
      });
      setIgAccessToken('');
      await load();
      Alert.alert(
        'Instagram connected',
        'Token stored for this workspace only. Public Meta publish stays closed. Transport send: ' +
          (result.sendingEnabled ? 'enabled' : 'disabled') +
          '.'
      );
    } catch (error) {
      Alert.alert('Could not connect Instagram', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function connectLine() {
    if (!workspaceId || saving) return;
    if (!lineDisplayName.trim() || !lineExternalAccountId.trim() || lineAccessToken.trim().length < 20) {
      Alert.alert('Missing details', 'Need display name, LINE external id, and a channel access token.');
      return;
    }
    if (Number.isNaN(Date.parse(lineAccessExpiresAt))) {
      Alert.alert('Check expiry', 'Expiry must be a valid ISO date-time.');
      return;
    }
    Alert.alert(
      'Connect LINE credentials?',
      'This stores a token for AngelOS staging/workspace use. It does NOT cut over your live LINE Agent. Only continue if these credentials are meant for AngelOS and will not disturb live LINE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Store for AngelOS',
          onPress: () => void doConnectLine()
        }
      ]
    );
  }

  async function doConnectLine() {
    if (!workspaceId || saving) return;
    setSaving(true);
    try {
      const result = await connectLineChannel(workspaceId, {
        provider: 'line',
        displayName: lineDisplayName.trim(),
        externalAccountId: lineExternalAccountId.trim(),
        accessToken: lineAccessToken.trim(),
        accessExpiresAt: new Date(lineAccessExpiresAt).toISOString()
      });
      setLineAccessToken('');
      await load();
      Alert.alert(
        'LINE credentials stored',
        'Workspace-only. Live LINE Agent cutover is still NOT done. Transport send: ' +
          (result.sendingEnabled ? 'enabled' : 'disabled') +
          '.'
      );
    } catch (error) {
      Alert.alert('Could not connect LINE', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function confirmDisconnectInstagram() {
    Alert.alert(
      'Disconnect Instagram?',
      'Revokes the stored token for this workspace. Does not reopen Meta verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => void disconnectInstagram() }
      ]
    );
  }

  function confirmDisconnectLine() {
    Alert.alert(
      'Disconnect LINE from AngelOS?',
      'Revokes the AngelOS-stored token for this workspace. This is not a live LINE Agent cutover reverse unless that was never separate.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => void disconnectLine() }
      ]
    );
  }

  async function disconnectInstagram() {
    if (!workspaceId || saving) return;
    setSaving(true);
    try {
      await disconnectMetaChannel(workspaceId, 'instagram');
      await load();
      Alert.alert('Instagram disconnected', 'Credential revoked for this workspace.');
    } catch (error) {
      Alert.alert('Could not disconnect', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function disconnectLine() {
    if (!workspaceId || saving) return;
    setSaving(true);
    try {
      await disconnectLineChannel(workspaceId);
      await load();
      Alert.alert('LINE disconnected', 'AngelOS credential revoked for this workspace.');
    } catch (error) {
      Alert.alert('Could not disconnect', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Pill tone="gold">Secure doorways</Pill>
      <ScreenTitle>Connections</ScreenTitle>
      <SupportText>
        LINE and Instagram doorways for your workspace. Meta public publish stays closed. Live LINE Agent is not cut over from this screen.
      </SupportText>

      <Pressable disabled={busy || saving} onPress={() => void load()} style={styles.refresh}>
        <SecondaryActionLabel>{busy ? 'Checking...' : 'Refresh status'}</SecondaryActionLabel>
      </Pressable>

      <Card premium>
        <View style={styles.row}>
          <SectionTitle>LINE</SectionTitle>
          <Pill tone={lineHealthy ? 'success' : 'warning'}>{lineHealthy ? 'Connected' : 'Not ready'}</Pill>
        </View>
        <BodyText>
          Stores a LINE channel access token for AngelOS only. Does not automatically replace or disturb your live LINE Agent.
        </BodyText>
        <SupportText>
          App credentials: {line?.channelCredentials.configured ? 'configured' : 'missing'} | Transport send:{' '}
          {line?.transport.enabled ? 'enabled' : 'disabled'} | Channel:{' '}
          {line?.channel ? line.channel.status : 'none'}
        </SupportText>
        {line?.connection ? (
          <SupportText>
            Token stored: {line.connection.tokenPresent ? 'yes' : 'no'} | Status: {line.connection.status}
            {line.connection.expired ? ' | expired' : ''}
          </SupportText>
        ) : (
          <SupportText>No LINE oauth connection for this workspace yet.</SupportText>
        )}
        {lineHealthy || line?.connection || line?.channel ? (
          <Pressable disabled={saving} onPress={confirmDisconnectLine} style={styles.action}>
            <SecondaryActionLabel>{saving ? 'Working...' : 'Disconnect LINE from AngelOS'}</SecondaryActionLabel>
          </Pressable>
        ) : null}
      </Card>

      <Card premium>
        <Pill tone="warning">LINE connect (no live cutover)</Pill>
        <SectionTitle>Store LINE credentials</SectionTitle>
        <SupportText>
          Paste values meant for AngelOS. Token is sent once over HTTPS and never shown again. You must still approve any live LINE Agent cutover separately.
        </SupportText>
        <Field label="Display name">
          <TextInput
            value={lineDisplayName}
            onChangeText={setLineDisplayName}
            placeholder="Angels Beauty LINE"
            placeholderTextColor={ui.colors.secondaryText}
            style={styles.input}
          />
        </Field>
        <Field label="LINE external account / user id">
          <TextInput
            value={lineExternalAccountId}
            onChangeText={setLineExternalAccountId}
            placeholder="LINE external id"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Field>
        <Field label="Channel access token">
          <TextInput
            value={lineAccessToken}
            onChangeText={setLineAccessToken}
            placeholder="Paste token (hidden)"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="Token expiry (ISO)">
          <TextInput
            value={lineAccessExpiresAt}
            onChangeText={setLineAccessExpiresAt}
            placeholder="2026-11-12T00:00:00.000Z"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Field>
        <Pressable
          disabled={saving || busy || !workspaceId}
          onPress={() => void connectLine()}
          style={({ pressed }) => [styles.action, (saving || pressed || !workspaceId) && styles.muted]}
        >
          <PrimaryActionLabel>{saving ? 'Saving...' : 'Save LINE connection'}</PrimaryActionLabel>
        </Pressable>
      </Card>

      <Card premium>
        <View style={styles.row}>
          <SectionTitle>Instagram</SectionTitle>
          <Pill tone={igHealthy ? 'success' : 'warning'}>{igHealthy ? 'Connected' : 'Not ready'}</Pill>
        </View>
        <BodyText>
          Stores a long-lived Instagram messaging token for this workspace only. Does not enable public posting or Meta App Review.
        </BodyText>
        <SupportText>
          App credentials: {meta?.appCredentials.configured ? 'configured' : 'missing'} | Webhook verify:{' '}
          {meta?.webhookVerifyToken.configured ? 'configured' : 'missing'} | Transport send:{' '}
          {meta?.transport.enabled ? 'enabled' : 'disabled'}
        </SupportText>
        {igConnection ? (
          <SupportText>
            Token stored: {igConnection.tokenPresent ? 'yes' : 'no'} | Status: {igConnection.status}
            {igConnection.expired ? ' | expired' : ''}
          </SupportText>
        ) : (
          <SupportText>No Instagram oauth connection for this workspace yet.</SupportText>
        )}
        {igChannel ? (
          <SupportText>
            Channel: {igChannel.status} | external id present: {igChannel.externalAccountIdPresent ? 'yes' : 'no'}
          </SupportText>
        ) : (
          <SupportText>No Instagram messaging channel row yet.</SupportText>
        )}
        {igHealthy || igConnection || igChannel ? (
          <Pressable disabled={saving} onPress={confirmDisconnectInstagram} style={styles.action}>
            <SecondaryActionLabel>{saving ? 'Working...' : 'Disconnect Instagram'}</SecondaryActionLabel>
          </Pressable>
        ) : null}
      </Card>

      <Card premium>
        <Pill tone="warning">Instagram connect (scoped)</Pill>
        <SectionTitle>Store Instagram credentials</SectionTitle>
        <SupportText>
          Paste values you already have. AngelOS will not invent tokens. Public Meta publish stays closed.
        </SupportText>
        <Field label="Display name">
          <TextInput
            value={igDisplayName}
            onChangeText={setIgDisplayName}
            placeholder="Angels Beauty Instagram"
            placeholderTextColor={ui.colors.secondaryText}
            style={styles.input}
          />
        </Field>
        <Field label="Instagram professional account id">
          <TextInput
            value={igExternalAccountId}
            onChangeText={setIgExternalAccountId}
            placeholder="Graph node / IG user id"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Field>
        <Field label="Long-lived access token">
          <TextInput
            value={igAccessToken}
            onChangeText={setIgAccessToken}
            placeholder="Paste token (hidden)"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="Token expiry (ISO)">
          <TextInput
            value={igAccessExpiresAt}
            onChangeText={setIgAccessExpiresAt}
            placeholder="2026-11-12T00:00:00.000Z"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Field>
        <Field label="Scopes (optional note)">
          <TextInput
            value={igScopes}
            onChangeText={setIgScopes}
            placeholder="instagram_basic,instagram_manage_messages"
            placeholderTextColor={ui.colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Field>
        <Pressable
          disabled={saving || busy || !workspaceId}
          onPress={() => void connectInstagram()}
          style={({ pressed }) => [styles.action, (saving || pressed || !workspaceId) && styles.muted]}
        >
          <PrimaryActionLabel>{saving ? 'Saving...' : 'Save Instagram connection'}</PrimaryActionLabel>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.row}>
          <SectionTitle>Meta public publish</SectionTitle>
          <Pill tone="critical">Closed</Pill>
        </View>
        <BodyText>
          Meta verification and public publishing remain closed. Instagram doorway here is private/scoped messaging credentials only.
        </BodyText>
      </Card>

      <Card>
        <SectionTitle>Channels in this workspace</SectionTitle>
        {channels.length === 0 ? (
          <SupportText>No messaging channels yet.</SupportText>
        ) : (
          channels.map((channel) => (
            <View key={channel.id} style={styles.channelRow}>
              <Text style={styles.channelTitle}>{channel.display_name}</Text>
              <SupportText>
                {channel.provider} | {channel.status}
              </SupportText>
            </View>
          ))
        )}
        <Link href="/messages" asChild>
          <Pressable style={styles.action}>
            <SecondaryActionLabel>Open Messages</SecondaryActionLabel>
          </Pressable>
        </Link>
      </Card>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  refresh: { alignSelf: 'flex-start', marginBottom: ui.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  field: { gap: ui.spacing.xs, marginTop: ui.spacing.xs },
  label: { color: ui.colors.primaryText, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    paddingHorizontal: ui.spacing.sm,
    color: ui.colors.primaryText,
    backgroundColor: ui.colors.elevated,
    fontSize: 16
  },
  channelRow: {
    gap: 2,
    paddingVertical: ui.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ui.colors.border
  },
  channelTitle: { color: ui.colors.primaryText, fontSize: 16, fontWeight: '700' },
  action: { marginTop: ui.spacing.sm },
  muted: { opacity: 0.55 }
});