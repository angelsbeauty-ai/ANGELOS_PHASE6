import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://hhzegavoyuicclsmrkwf.supabase.co';

// In a real app, use a proper auth flow; here we just use anon key for read-only demo.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoei' + 'ZWZ2F2b3l1aWNjbHNtcmt3ZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI0MTc2ODM0LCJleHAiOjIwMzk3OTI4MzR9.6j0T5Hq3k3z3x3y3z3x3y3z3x3y3z3x3y3z3x3y3z3x';

type ConversationRow = {
  id: number;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export default function HermesHistoryScreen() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setClient(c);
    loadUserId();
  }, []);

  async function loadUserId() {
    // For now, use a fixed demo user; replace with real auth userId in production.
    const demoUserId = 'demo-user-1';
    setUserId(demoUserId);
  }

  async function loadHistory() {
    if (!client || !userId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await client
        .from('hermes_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (err) throw err;
      setRows(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!client || !userId) return;
    try {
      setLoading(true);
      setError(null);
      const { error: err } = await client.from('hermes_conversations').delete().eq('user_id', userId);
      if (err) throw err;
      setRows([]);
    } catch (e: any) {
      setError(e?.message || 'Failed to clear history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) loadHistory();
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hermes Conversation History</Text>

      {userId && (
        <Text style={styles.subtitle}>User: {userId}</Text>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={loadHistory}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearHistory}>
          <Text style={styles.buttonText}>Clear history</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && rows.length === 0 && (
        <Text style={styles.muted}>No conversation history found.</Text>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.item, item.role === 'assistant' ? styles.assistant : styles.user]}>
            <Text style={styles.role}>{item.role}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 16 },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  dangerButton: {
    backgroundColor: '#a00',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  center: { alignItems: 'center', marginVertical: 16 },
  muted: { color: '#666', textAlign: 'center' },
  error: { color: '#a00', marginBottom: 12 },
  item: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  user: {
    backgroundColor: '#eef',
  },
  assistant: {
    backgroundColor: '#efe',
  },
  role: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#666',
  },
});
