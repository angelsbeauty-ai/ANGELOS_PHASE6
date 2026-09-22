import { useState, useCallback } from 'react';
import * as LiveKit from 'livekit-client';

// Supabase Edge Function URLs
const SUPABASE_URL = 'https://hhzegavoyuicclsmrkwf.supabase.co';
const VOICE_ENDPOINT = `${SUPABASE_URL}/functions/v1/api/ai/voice/session`;
const AGENT_ENDPOINT = `${SUPABASE_URL}/functions/v1/voice-agent`;

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
  const [agentJoined, setAgentJoined] = useState(false);

  const startSession = useCallback(async (options?: { userId?: string; displayName?: string; language?: 'ja' | 'en' | 'auto' }) => {
    try {
      setIsConnecting(true);
      setError(null);
      setAgentJoined(false);

      const res = await fetch(VOICE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Voice session request failed: ${res.status}`);
      }

      const session: HermesVoiceSession = await res.json();

      // Ask the Hermes agent to join this room (pass userId for memory)
      try {
        const agentRes = await fetch(AGENT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: session.roomName, userId: options?.userId }),
        });
        if (agentRes.ok) {
          setAgentJoined(true);
        }
      } catch {
        // Agent join is optional; don't fail the session if this fails.
      }

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
      setAgentJoined(false);
    }
  }, [room]);

  return { room, isConnecting, error, startSession, endSession, agentJoined };
}
