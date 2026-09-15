import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Approval {
  id: string;
  type: string;
  content: string;
  client_name: string;
  status: string;
  created_at: string;
}

export default function ApprovalsScreen() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      // Use timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // In production, this would call your API
      // For now, show empty state
      setApprovals([]);
      setLoading(false);
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.log('Approvals fetch error (expected in dev):', err.message);
      setApprovals([]);
      setLoading(false);
      setError(null); // Don't show error to user
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <View style={styles.placeholder} />
      </View>

      {approvals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No pending approvals</Text>
          <Text style={styles.emptySubtext}>All caught up!</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {approvals.map((approval) => (
            <View key={approval.id} style={styles.card}>
              <Text style={styles.cardType}>{approval.type}</Text>
              <Text style={styles.cardContent}>{approval.content}</Text>
              <Text style={styles.cardClient}>{approval.client_name}</Text>
              <Text style={styles.cardDate}>
                {new Date(approval.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  backButton: { fontSize: 28, color: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '600', color: '#f1f5f9' },
  placeholder: { width: 28 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#f1f5f9' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  list: { padding: 16 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardType: { fontSize: 12, color: '#0ea5e9', fontWeight: '600', marginBottom: 8 },
  cardContent: { fontSize: 15, color: '#f1f5f9', marginBottom: 8 },
  cardClient: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#64748b' },
});
