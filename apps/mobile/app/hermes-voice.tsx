import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useHermesVoiceLiveKit } from '../src/lib/useHermesVoiceLiveKit';
import { useSpeechToText } from '../src/lib/useSpeechToText';
import * as LiveKit from 'livekit-client';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const SUPABASE_URL = 'https://hhzegavoyuicclsmrkwf.supabase.co';
const VOICE_ENDPOINT = `${SUPABASE_URL}/functions/v1/api/ai/voice/session`;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HermesVoiceScreen() {
  const router = useRouter();
  const { room, isConnecting, error, startSession, endSession, agentJoined } = useHermesVoiceLiveKit();
  const { isListening, transcript, error: sttError, startListening, stopListening, setTranscript } = useSpeechToText({ language: 'ja-JP' });
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [showTutorial, setShowTutorial] = useState(true);

  // Draggable avatar
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH / 2 - 40, y: SCREEN_HEIGHT / 2 })).current;
  const scale = useRef(new Animated.Value(1)).current;
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

  // Pulse animation when speaking
  useEffect(() => {
    if (agentState === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [agentState]);

  useEffect(() => {
    if (!room) {
      setStatus('idle');
      setAgentState('idle');
      return;
    }
    setStatus('connected');
  }, [room]);

  // Auto-send transcript
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

  const [lastSent, setLastSent] = useState('');

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

  const handleAvatarTap = async () => {
    if (status === 'connected') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      {/* Tutorial Overlay */}
      {showTutorial && (
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialBox}>
            <Text style={styles.tutorialTitle}>👋 Welcome!</Text>
            <Text style={styles.tutorialText}>Drag Hermes around the screen</Text>
            <Text style={styles.tutorialText}>Tap Hermes to make it listen</Text>
            <Text style={styles.tutorialText}>Speak in Japanese</Text>
            <TouchableOpacity style={styles.tutorialButton} onPress={() => setShowTutorial(false)}>
              <Text style={styles.tutorialButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Draggable Hermes Avatar */}
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
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

      {status === 'connected' && agentJoined && (
        <View style={styles.row}>
          <Text style={styles.ok}>● Hermes agent connected</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>{room ? 'End' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      {/* Speech */}
      {status === 'connected' && (
        <View style={styles.speechSection}>
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>You:</Text>
              <Text style={styles.transcript}>{transcript}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Tap Hermes and speak…</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  tutorialOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, justifyContent: 'center', alignItems: 'center' },
  tutorialBox: { backgroundColor: '#222', padding: 24, borderRadius: 16, maxWidth: 300 },
  tutorialTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  tutorialText: { fontSize: 14, color: '#ccc', marginBottom: 8, textAlign: 'center' },
  tutorialButton: { backgroundColor: '#0a0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  tutorialButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  avatarContainer: { position: 'absolute', zIndex: 1000 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  historyLink: { fontSize: 14, color: '#0af', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statusText: { fontSize: 16, color: '#fff', marginLeft: 8 },
  muted: { fontSize: 14, color: '#888' },
  ok: { color: '#0f0' },
  controls: { padding: 16 },
  button: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  speechSection: { flex: 1, padding: 16 },
  transcriptBox: { padding: 12, backgroundColor: '#222', borderRadius: 8 },
  transcriptLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  transcript: { fontSize: 14, color: '#fff' },
});
