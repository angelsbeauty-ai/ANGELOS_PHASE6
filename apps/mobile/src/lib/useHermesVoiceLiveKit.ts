import { useState, useCallback } from 'react';
import * as LiveKit from 'livekit-client';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-backend-url.com/api';

export type HermesVoiceSession = {
  serverUrl: string;
  token: string;
  roomName: string;
  participantIdentity: string;
  expiresInSeconds: number;
  language: 'ja' | 'en' | 'auto';
};

export function useHermesVoiceLiveKit() {
  const [room, setRoom] = useState<LiveKit.Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (options?: { userId?: string; displayName?: string; language?: 'ja' | 'en' | 'auto' }) => {
    try {
      setIsConnecting(true);
      setError(null);

      const res = await fetch(`${API_BASE}/ai/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Voice session request failed: ${res.status}`);
      }

      const session: HermesVoiceSession = await res.json();

      const lkRoom = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
      });

      await lkRoom.connect(session.serverUrl, session.token, {
        autoSubscribe: true,
      });

      setRoom(lkRoom);
      return session;
    } catch (e: any) {
      setError(e?.message || 'Failed to start voice session');
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
  }, [room]);

  return { room, isConnecting, error, startSession, endSession };
}
