import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useHermesVoiceLiveKit } from '../src/lib/useHermesVoiceLiveKit';
import { useSpeechToText } from '../src/lib/useSpeechToText';
import * as LiveKit from 'livekit-client';

const SUPABASE_URL = 'https://hhzegavoyuicclsmrkwf.supabase.co';
const VOICE_ENDPOINT = `${SUPABASE_URL}/functions/v1/api/ai/voice/session`;

export default function HermesVoiceScreen() {
  const { room, isConnecting, error, startSession, endSession, agentJoined } = useHermesVoiceLiveKit();
  const { isListening, transcript, error: sttError, startListening, stopListening, setTranscript } = useSpeechToText({ language: 'ja-JP' });
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [lastSent, setLastSent] = useState('');

  useEffect(() => {
    if (!room) {
      setStatus('idle');
      return;
    }

    const onDisconnected = () => {
      setStatus('idle');
    };

    room.on('disconnected', onDisconnected);
    setStatus('connected');

    return () => {
      room.off('disconnected', onDisconnected);
    };
  }, [room]);

  // Auto-send transcript when user stops speaking
  useEffect(() => {
    if (!room || !transcript || transcript === lastSent) return;
    if (!isListening && transcript.trim().length > 0) {
      sendUserSpeech(transcript);
      setLastSent(transcript);
    }
  }, [isListening, transcript, room]);

  const handleToggle = async () => {
    try {
      if (room) {
        await endSession();
      } else {
        await startSession({ language: 'auto', displayName: 'AngelOs user' });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await fetch(VOICE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'auto', displayName: 'Test user' }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, status: res.status, data });
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setTesting(false);
    }
  };

  const sendUserSpeech = async (text: string) => {
    if (!room || !text.trim()) return;
    try {
      const payload = { type: 'user-speech', text: text.trim() };
      await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), { topic: 'chat' });
      setTranscript('');
      setLastSent('');
    } catch (e) {
      console.error('Send speech error:', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hermes Voice</Text>

      {isConnecting && (
        <View style={styles.row}>
          <ActivityIndicator size="small" />
          <Text style={styles.statusText}>Connecting…</Text>
        </View>
      )}

      {status === 'connected' && room && (
        <View style={styles.row}>
          <Text style={styles.statusText}>Live voice active</Text>
          <Text style={styles.muted}>Room: {(room as any).name}</Text>
        </View>
      )}

      {status === 'connected' && agentJoined && (
        <View style={styles.row}>
          <Text style={styles.ok}>Hermes agent in the room</Text>
        </View>
      )}

      {status === 'connected' && !agentJoined && (
        <View style={styles.row}>
          <Text style={styles.muted}>Agent not joined (still ok for now)</Text>
        </View>
      )}

      {status === 'error' && error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {status === 'idle' && !isConnecting && (
        <Text style={styles.muted}>Tap to start a voice conversation with Hermes</Text>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>{room ? 'End voice' : 'Start voice'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTest}>
          <Text style={styles.buttonText}>Test session</Text>
        </TouchableOpacity>
      </View>

      {status === 'connected' && (
        <View style={styles.micSection}>
          <Text style={styles.label}>Speak to Hermes</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.micButton, isListening ? styles.micActive : {}]}
              onPress={isListening ? stopListening : startListening}
            >
              <Text style={styles.micIcon}>{isListening ? '🎤' : '🎙️'}</Text>
              <Text style={styles.buttonText}>{isListening ? 'Listening…' : 'Tap to speak'}</Text>
            </TouchableOpacity>
          </View>
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>You said:</Text>
              <Text style={styles.transcript}>{transcript}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Your speech will appear here</Text>
          )}
          {sttError && <Text style={styles.error}>STT: {sttError}</Text>}
        </View>
      )}

      {testing && (
        <View style={styles.row}>
          <ActivityIndicator size="small" />
          <Text style={styles.statusText}>Testing…</Text>
        </View>
      )}

      {testResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Test result</Text>
          <Text style={testResult.ok ? styles.ok : styles.error}>
            {testResult.ok ? 'OK' : 'Failed'}
          </Text>
          {testResult.status && <Text style={styles.muted}>Status: {testResult.status}</Text>}
          {testResult.data && (
            <Text style={styles.muted} numberOfLines={6}>
              {JSON.stringify(testResult.data, null, 2)}
            </Text>
          )}
          {testResult.error && (
            <Text style={styles.error}>{testResult.error}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 16, marginLeft: 8 },
  muted: { fontSize: 12, color: '#666', marginLeft: 8 },
  error: { color: '#d33', marginBottom: 12 },
  ok: { color: '#0a0', marginLeft: 8 },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  testButton: {
    backgroundColor: '#333',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  micSection: { marginTop: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  micActive: {
    backgroundColor: '#0a0',
  },
  micIcon: { fontSize: 20, marginRight: 8 },
  transcriptBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  transcriptLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  transcript: { fontSize: 14 },
});
