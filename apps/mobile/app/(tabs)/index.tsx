import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'AngelOs', headerStyle: { backgroundColor: '#000000' }, headerTintColor: '#ffffff' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>AngelOs</Text>
          <Text style={styles.subtitle}>AI-powered salon OS</Text>
        </View>

        <View style={styles.grid}>
          <Link href="/ai-settings" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <FontAwesome name="cog" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>AI Settings</Text>
                <Text style={styles.cardText}>Configure AI</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/approvals" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <FontAwesome name="check-circle" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>Approvals</Text>
                <Text style={styles.cardText}>Requests</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/hermes-voice" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <FontAwesome name="microphone" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>Hermes Voice</Text>
                <Text style={styles.cardText}>Voice AI</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/system-check" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <FontAwesome name="heart-pulse" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>System Check</Text>
                <Text style={styles.cardText}>Health</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.aiCard}>
          <FontAwesome name="robot" size={32} color="#ffffff" />
          <Text style={styles.aiTitle}>AI Assistant Ready</Text>
          <Text style={styles.aiText}>AngelOs is configured and ready to help with your salon business.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, justifyContent: 'center' },
  card: { width: 150, height: 150, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginTop: 8, textAlign: 'center' },
  cardText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' },
  aiCard: { margin: 16, padding: 24, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  aiTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginTop: 12, marginBottom: 8 },
  aiText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 18 },
});
