import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HermesHistoryScreen() {
  const router = useRouter();
  const [sessions] = useState([
    { id: 1, date: '2026-09-16', time: '01:45', topic: '予約確認', duration: '3:24' },
    { id: 2, date: '2026-09-15', time: '14:20', topic: 'レッスン質問', duration: '5:12' },
    { id: 3, date: '2026-09-15', time: '10:05', topic: '商品案内', duration: '2:48' },
  ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hermes History</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {sessions.map((session) => (
          <TouchableOpacity key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTopic}>{session.topic}</Text>
              <Text style={styles.sessionDate}>{session.date} at {session.time}</Text>
            </View>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionDuration}>{session.duration}</Text>
              <Text style={styles.sessionArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.clearButton}>
        <Text style={styles.clearButtonText}>Clear All History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#121212', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  backButton: { fontSize: 28, color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  placeholder: { width: 28 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#aaa', marginBottom: 16 },
  sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 16, borderRadius: 12, marginBottom: 12 },
  sessionInfo: { flex: 1 },
  sessionTopic: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  sessionDate: { fontSize: 13, color: '#888' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center' },
  sessionDuration: { fontSize: 13, color: '#666', marginRight: 12 },
  sessionArrow: { fontSize: 18, color: '#666' },
  clearButton: { backgroundColor: '#2a2a2a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  clearButtonText: { fontSize: 15, color: '#f44', fontWeight: '600' },
});
