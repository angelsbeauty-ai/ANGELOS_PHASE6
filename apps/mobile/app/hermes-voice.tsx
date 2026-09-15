import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, PanResponder, Animated, Dimensions } from 'react-native';
import { useHermesVoiceLiveKit } from '../src/lib/useHermesVoiceLiveKit';
import { useSpeechToText } from '../src/lib/useSpeechToText';
import * as LiveKit from 'livekit-client';
import { useRouter } from 'expo-router';

const SUPABASE_URL = 'https://hhzegavoyuicclsmrkwf.supabase.co';
const VOICE_ENDPOINT = `${SUPABASE_URL}/functions/v1/api/ai/voice/session`;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HermesVoiceScreen() {
  const router = useRouter();
  const { room, isConnecting, error, startSession, endSession, agentJoined } = useHermesVoiceLiveKit();
  const { isListening, transcript, error: sttError, startListening, stopListening, setTranscript } = useSpeechToText({ language: 'ja-JP' });
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [lastSent, setLastSent] = useState('');
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  // Draggable avatar
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH / 2 - 40, y: SCREEN_HEIGHT / 2 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx + SCREEN_WIDTH / 2 - 40, y: gestureState.dy + SCREEN_HEIGHT / 2 });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
      },
    })
  ).current;

  useEffect(() => {
    if (!room) {
      setStatus('idle');
      setAgentState('idle');
      return;
    }

    const onDisconnected = () => {
      setStatus('idle');
      setAgentState('idle');
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
      setAgentState('thinking');
      setTimeout(() => setAgentState('speaking'), 800);
      setTimeout(() => setAgentState('idle'), 2500);
    }
  }, [isListening, transcript, room]);

  const handleToggle = async () => {
    try {
      if (room) {
        await endSession();
      } else {
        await startSession({ userId: 'demo-user-1', language: 'auto', displayName: 'AngelOs user' });
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

  const handleAvatarTap = () => {
    if (status === 'connected') {
      startListening();
      setAgentState('listening');
    }
  };

  const getAvatarEmoji = () => {
    switch (agentState) {
      case 'listening': return '👂';
      case 'thinking': return '🤔';
      case 'speaking': return '🗣️';
      default: return '🤖';
    }
  };

  const getAvatarColor = () => {
    switch (agentState) {
      case 'listening': return '#0a0';
      case 'thinking': return '#aa0';
      case 'speaking': return '#00a';
      default: return '#333';
    }
  };

  return (
    <View style={styles.container}>
      {/* Draggable Hermes Avatar */}
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: getAvatarColor() }]}
          onPress={handleAvatarTap}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarEmoji}>{getAvatarEmoji()}</Text>
          <Text style={styles.avatarLabel}>Hermes</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hermes Voice</Text>
        <TouchableOpacity onPress={() => router.push('/hermes-history')}>
          <Text style={styles.historyLink}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
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

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>{room ? 'End voice' : 'Start voice'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTest}>
          <Text style={styles.buttonText}>Test session</Text>
        </TouchableOpacity>
      </View>

      {/* Speech */}
      {status === 'connected' && (
        <View style={styles.speechSection}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  avatarContainer: { position: 'absolute', zIndex: 1000 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  historyLink: { fontSize: 14, color: '#0af', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statusText: { fontSize: 16, color: '#fff', marginLeft: 8 },
  muted: { fontSize: 12, color: '#888', marginLeft: 8 },
  error: { color: '#f33', padding: 16 },
  ok: { color: '#0f0', marginLeft: 8 },
  controls: { flexDirection: 'row', padding: 16 },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  testButton: { backgroundColor: '#222' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  speechSection: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  micActive: { backgroundColor: '#0a0' },
  micIcon: { fontSize: 20, marginRight: 8 },
  transcriptBox: { marginTop: 12, padding: 12, backgroundColor: '#222', borderRadius: 8 },
  transcriptLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  transcript: { fontSize: 14, color: '#fff' },
  resultBox: { margin: 16, padding: 12, backgroundColor: '#222', borderRadius: 8 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 8 },
});
