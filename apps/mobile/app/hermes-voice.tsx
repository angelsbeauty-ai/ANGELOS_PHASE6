import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import { useHermesVoiceLiveKit } from '../src/lib/useHermesVoiceLiveKit';
import { useSpeechToText } from '../src/lib/useSpeechToText';
import * as LiveKit from 'livekit-client';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    const checkTutorial = async () => {
      const seen = await AsyncStorage.getItem('hermes_tutorial_seen');
      if (seen === 'true') setShowTutorial(false);
    };
    checkTutorial();
  }, []);

  useEffect(() => {
    if (!room) {
      setStatus('idle');
      setAgentState('idle');
      return;
    }
    setStatus('connected');
  }, [room]);

  const [lastSent, setLastSent] = useState('');

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

  const handleTutorialDismiss = async () => {
    await AsyncStorage.setItem('hermes_tutorial_seen', 'true');
    setShowTutorial(false);
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
      default: return '#2a2a2a';
    }
  };

  return (
    <View style={styles.container}>
      {showTutorial && (
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialBox}>
            <Text style={styles.tutorialTitle}>👋 Welcome!</Text>
            <Text style={styles.tutorialText}>Drag Hermes around</Text>
            <Text style={styles.tutorialText}>Tap to make it listen</Text>
            <Text style={styles.tutorialText}>Speak in Japanese</Text>
            <TouchableOpacity style={styles.tutorialButton} onPress={handleTutorialDismiss}>
              <Text style={styles.tutorialButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Animated.View
        style={[
          styles.avatarContainer,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }] },
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

      <View style={styles.header}>
        <Text style={styles.title}>Hermes</Text>
        <View style={styles.headerLinks}>
          <TouchableOpacity onPress={() => router.push('/hermes-settings')}>
            <Text style={styles.headerLink}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/hermes-history')}>
            <Text style={styles.headerLink}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isConnecting && (
        <View style={styles.row}>
          <ActivityIndicator size="small" />
          <Text style={styles.statusText}>Connecting…</Text>
        </View>
      )}

      {status === 'connected' && agentJoined && (
        <View style={styles.row}>
          <Text style={styles.ok}>● Connected</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>{room ? 'End' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#121212' },
  tutorialOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, justifyContent: 'center', alignItems: 'center' },
  tutorialBox: { backgroundColor: '#1e1e1e', padding: 28, borderRadius: 20, maxWidth: 320, borderWidth: 1, borderColor: '#333' },
  tutorialTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  tutorialText: { fontSize: 15, color: '#ccc', marginBottom: 10, textAlign: 'center' },
  tutorialButton: { backgroundColor: '#0a0', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  tutorialButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  avatarContainer: { position: 'absolute', zIndex: 1000 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerLinks: { flexDirection: 'row', gap: 16 },
  headerLink: { fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statusText: { fontSize: 16, color: '#fff', marginLeft: 8 },
  muted: { fontSize: 14, color: '#666' },
  ok: { color: '#0f0', fontSize: 15, fontWeight: '600' },
  controls: { padding: 16 },
  button: { backgroundColor: '#1e1e1e', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  speechSection: { flex: 1, padding: 16 },
  transcriptBox: { padding: 16, backgroundColor: '#1e1e1e', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  transcriptLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  transcript: { fontSize: 15, color: '#fff' },
});
