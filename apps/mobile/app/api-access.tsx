import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { defaultApiUrl, getApiBaseUrl, pingApi, setApiBaseUrl } from '../src/lib/api-access';

export default function ApiAccessScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(defaultApiUrl());
  const [status, setStatus] = useState('Load the URL, then ping.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const current = await getApiBaseUrl();
      setUrl(current);
      setSaved(current);
    })();
  }, []);

  async function onSave() {
    setBusy(true);
    try {
      const next = await setApiBaseUrl(url);
      setSaved(next);
      setUrl(next);
      setStatus(`Saved. Phone will call ${next}`);
    } finally {
      setBusy(false);
    }
  }

  async function onPing() {
    setBusy(true);
    try {
      const result = await pingApi(url || saved);
      setStatus(
        result.ok
          ? `OK ${result.status} — ${result.url}\n${result.body}`
          : `FAIL ${result.status} — ${result.url}\n${result.body}`
      );
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setBusy(true);
    try {
      const next = await setApiBaseUrl('');
      setSaved(next);
      setUrl(next);
      setStatus(`Reset to build default: ${next}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
      <Text style={styles.title}>API Access</Text>
      <Text style={styles.sub}>
        Point this phone at the live AngelOS server. Does not delete any features.
        Default from the build is {defaultApiUrl()}.
      </Text>

      <Text style={styles.label}>API URL</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://your-api.up.railway.app"
        placeholderTextColor="#64748b"
        style={styles.input}
      />
      <Text style={styles.hint}>Active: {saved}</Text>

      <Pressable style={styles.btn} onPress={() => void onSave()} disabled={busy}>
        <Text style={styles.btnText}>Save URL</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => void onPing()} disabled={busy}>
        <Text style={styles.btnText}>Ping /health/ready</Text>
      </Pressable>
      <Pressable style={styles.ghost} onPress={() => void onReset()} disabled={busy}>
        <Text style={styles.ghostText}>Reset to build default</Text>
      </Pressable>

      {busy ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 16 }} /> : null}
      <View style={styles.log}><Text style={styles.logText}>{status}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 56 },
  back: { color: '#38bdf8', fontSize: 16, marginBottom: 16 },
  title: { color: '#f1f5f9', fontSize: 28, fontWeight: '700' },
  sub: { color: '#94a3b8', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  label: { color: '#cbd5e1', fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#f1f5f9',
    padding: 14,
    backgroundColor: '#1e293b'
  },
  hint: { color: '#64748b', fontSize: 12, marginTop: 8, marginBottom: 20 },
  btn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  btnText: { color: '#0f172a', fontWeight: '700' },
  ghost: { padding: 12, alignItems: 'center' },
  ghostText: { color: '#94a3b8' },
  log: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  logText: { color: '#e2e8f0', fontFamily: 'SpaceMono', fontSize: 12, lineHeight: 18 }
});
