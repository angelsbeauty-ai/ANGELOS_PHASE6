import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import {
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  ScreenTitle,
  SecondaryActionLabel,
  SupportText,
  ui
} from '../../src/components/ui';
import { listClients, type ClientSummary } from '../../src/lib/clients';
import { getActiveWorkspace } from '../../src/lib/workspace';

export default function ClientsScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load(query = '') {
    setBusy(true);
    try {
      const workspace = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
      if (!workspaceId) setWorkspaceId(workspace.id);
      setClients(await listClients(workspace.id, query));
    } catch (error) {
      Alert.alert('Could not load clients', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Pill tone="gold">Client Memory</Pill>
          <ScreenTitle>Clients</ScreenTitle>
          <SupportText>One connected history for every client, inquiry and treatment.</SupportText>
          {!busy ? (
            <SupportText>
              {clients.length === 0
                ? 'Live from staging: no clients yet — AngelOS will not invent people.'
                : 'Live from staging: ' + clients.length + ' client' + (clients.length === 1 ? '' : 's')}
            </SupportText>
          ) : null}
        </View>
        <Link href="/clients/new" asChild>
          <Pressable style={styles.addButton}>
            <PrimaryActionLabel>New Client</PrimaryActionLabel>
          </Pressable>
        </Link>
      </View>

      <Card>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search client name"
          placeholderTextColor={ui.colors.secondaryText}
          style={styles.search}
        />
        <Pressable onPress={() => void load(search)}>
          <SecondaryActionLabel>Search</SecondaryActionLabel>
        </Pressable>
      </Card>

      {busy ? <Card><BodyText>Loading clients...</BodyText></Card> : null}
      {!busy && clients.length === 0 ? (
        <Card premium>
          <Pill tone="warning">First client</Pill>
          <BodyText>No clients yet.</BodyText>
          <SupportText>Add one real client to unlock bookings and treatment history. AngelOS will not invent people.</SupportText>
          <Link href="/clients/new" asChild>
            <Pressable style={styles.addButton}>
              <PrimaryActionLabel>Add first client</PrimaryActionLabel>
            </Pressable>
          </Link>
        </Card>
      ) : null}
      {clients.map((client) => (
        <Link key={client.id} href={{ pathname: '/clients/[id]', params: { id: client.id } }} asChild>
          <Pressable>
            <Card>
              <View style={styles.clientRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{client.display_name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.clientCopy}>
                  <Text style={styles.clientName}>{client.display_name}</Text>
                  <SupportText>{client.status.replaceAll('_', ' ')} | {client.language}</SupportText>
                  {client.phone || client.email ? <SupportText>{client.phone ?? client.email}</SupportText> : null}
                </View>
                {client.do_not_auto_message ? <Pill tone="warning">manual only</Pill> : null}
              </View>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: ui.spacing.xs },
  addButton: { width: 124 },
  search: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    padding: ui.spacing.sm,
    fontSize: 16
  },
  clientRow: { flexDirection: 'row', gap: ui.spacing.sm, alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: ui.colors.softGold,
    backgroundColor: ui.colors.warmSurface,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: ui.colors.gold, fontWeight: '700', fontSize: 18 },
  clientCopy: { flex: 1, gap: 2 },
  clientName: { color: ui.colors.primaryText, fontSize: 17, fontWeight: '700' }
});
