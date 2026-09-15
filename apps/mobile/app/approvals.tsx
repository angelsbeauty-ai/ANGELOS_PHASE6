import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ApprovalsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <View style={styles.emptyCard}>
          <FontAwesome name="check-circle" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>No Pending Approvals</Text>
          <Text style={styles.emptyText}>All requests have been processed.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  placeholder: { width: 24 },
  section: { padding: 16, marginTop: 8 },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 32, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
