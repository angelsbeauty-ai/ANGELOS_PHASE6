import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

export type TTSProvider = 'device' | 'cloud';

export function useOnDeviceTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, options?: { language?: string; rate?: number; pitch?: number }) => {
    if (!text || !text.trim()) return;
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: options?.language || 'ja-JP',
        rate: options?.rate ?? 0.92,
        pitch: options?.pitch ?? 1,
        volume: 1,
        onStart: () => {},
        onEnd: () => setIsSpeaking(false),
        onError: (e) => {
          console.error('TTS error:', e);
          setIsSpeaking(false);
        },
      });
    } catch (e) {
      console.error('TTS speak error:', e);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    try { Speech.stop(); } catch (e) { console.error('TTS stop error:', e); }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}

/**
 * Router: decides whether the phone speaks locally (free) or waits for cloud audio.
 * For now, always route to device TTS — saves OpenAI TTS credits on every turn.
 * Later: add classifier to route simple text locally, send audio for complex/expressed speech.
 */
export function useTTTRouter() {
  const deviceTTS = useOnDeviceTTS();
  const [provider, setProvider] = useState<TTSProvider>('device');

  const speak = useCallback(async (text: string, preferCloud = false) => {
    if (preferCloud) {
      setProvider('cloud');
      // Cloud path: audio arrives via LiveKit track from voice agent server.
      // Phone does NOT speak locally — the server's audio is streamed in.
      return;
    }
    setProvider('device');
    await deviceTTS.speak(text, { language: 'ja-JP' });
  }, [deviceTTS]);

  const stop = useCallback(() => {
    deviceTTS.stop();
    setProvider('device');
  }, [deviceTTS]);

  return { speak, stop, provider, isSpeaking: deviceTTS.isSpeaking, deviceTTS };
}
