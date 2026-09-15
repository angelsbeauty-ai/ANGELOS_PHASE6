import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'AngelOs', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f1f5f9' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome to AngelOs</Text>
          <Text style={styles.subtitle}>Your AI-powered salon OS</Text>
        </View>

        <View style={styles.grid}>
          <Link href="/ai-settings" asChild>
            <TouchableOpacity style={styles.card}>
              <FontAwesome name="cog" size={28} color="#0ea5e9" />
              <Text style={styles.cardTitle}>AI Settings</Text>
              <Text style={styles.cardText}>Configure AI assistant</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/approvals" asChild>
            <TouchableOpacity style={styles.card}>
              <FontAwesome name="check-circle" size={28} color="#10b981" />
              <Text style={styles.cardTitle}>Approvals</Text>
              <Text style={styles.cardText}>Pending requests</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/hermes-voice" asChild>
            <TouchableOpacity style={styles.card}>
              <FontAwesome name="microphone" size={28} color="#f59e0b" />
              <Text style={styles.cardTitle}>Hermes Voice</Text>
              <Text style={styles.cardText}>Voice assistant</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/system-check" asChild>
            <TouchableOpacity style={styles.card}>
              <FontAwesome name="heart-pulse" size={28} color="#ef4444" />
              <Text style={styles.cardTitle}>System Check</Text>
              <Text style={styles.cardText}>Test all features</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.aiCard}>
          <FontAwesome name="robot" size={32} color="#0ea5e9" />
          <Text style={styles.aiTitle}>AI Assistant Ready</Text>
          <Text style={styles.aiText}>AngelOs is configured and ready to help with your salon business.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#f1f5f9' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16, justifyContent: 'center' },
  card: { width: 160, backgroundColor: '#1e293b', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginTop: 12, marginBottom: 4 },
  cardText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  aiCard: { margin: 16, padding: 24, backgroundColor: '#1e293b', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  aiTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginTop: 12, marginBottom: 8 },
  aiText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
