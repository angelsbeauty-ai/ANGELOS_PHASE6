import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useHermesVoiceLiveKit } from '../src/lib/useHermesVoiceLiveKit';
import * as LiveKit from 'livekit-client';

export default function HermesVoiceScreen() {
  const { room, isConnecting, error, startSession, endSession } = useHermesVoiceLiveKit();
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');

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

  return (
    <View style={styles.container}>
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

      {status === 'error' && error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {status === 'idle' && !isConnecting && (
        <Text style={styles.muted}>Tap to start a voice conversation with Hermes</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleToggle}>
        <Text style={styles.buttonText}>{room ? 'End voice' : 'Start voice'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 16, marginLeft: 8 },
  muted: { fontSize: 12, color: '#666', marginLeft: 8 },
  error: { color: '#d33', marginBottom: 12 },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
