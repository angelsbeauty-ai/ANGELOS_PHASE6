import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Screen } from '../src/components/Screen';
import { getActiveWorkspace } from '../src/lib/workspace';
import { sendVoiceToHermes, type VoiceRequest, type VoiceResponse } from '../src/lib/hermes-voice';

const palette = {
  background: '#FCFBF8',
  elevated: '#FFFFFF',
  warmSurface: '#F6F2EB',
  primaryText: '#191919',
  secondaryText: '#6F6A63',
  border: '#EAE5DD',
  gold: '#B9975B',
  softGold: '#E9DDC7',
  success: '#557662',
  warning: '#A87942',
  critical: '#A45E59',
};

const radius = { card: 18, control: 16, pill: 999 };
const spacing = { xs: 8, sm: 16, md: 24 };
const shadow = {
  soft: {
    shadowColor: '#191919',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
};

export default function HermesVoiceScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load workspace on mount
  useEffect(() => {
    loadWorkspace();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording]);

  const speak = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;
    try {
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1,
        rate: 0.95,
        volume: 1,
      });
    } catch {
      // Speech not available on this device
    }
  }, []);

  async function loadWorkspace() {
    try {
      const w = await getActiveWorkspace();
      setWorkspaceId(w.id);
    } catch {
      setError('No workspace found. Please sign in.');
    }
  }

  async function startRecording() {
    if (!workspaceId || busy) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      setTranscript('');
      setReply('');
      setError(null);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError('Couldn\'t start recording. Check microphone permission.');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const filename = `voice-${Date.now()}.m4a`;

        await sendAudioToHermes(base64, filename);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording.');
      setRecording(null);
      setIsRecording(false);
    }
  }

  async function sendAudioToHermes(base64: string, filename: string) {
    if (!workspaceId) return;

    setBusy(true);
    setError(null);

    try {
      const request: VoiceRequest = { audioBase64: base64, filename };
      const response: VoiceResponse = await sendVoiceToHermes(workspaceId, request);

      setTranscript(response.transcript);
      setReply(response.reply);

      if (response.reply) {
        speak(response.reply);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send voice message.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function replayVoice() {
    if (!reply) return;
    speak(reply);
  }

  async function resetVoice() {
    setTranscript('');
    setReply('');
    setError(null);
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Talk to Hermes</Text>
        <Text style={[styles.mutedText, { marginTop: spacing.sm }]}>
          Tap the microphone to record a voice message. Hermes will listen and talk back.
        </Text>

        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.cardTitle}>Issue</Text>
            <Text style={[styles.bodyText, { color: palette.secondaryText }]}>{error}</Text>
            {workspaceId && (
              <Pressable onPress={resetVoice} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>Try again</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {!workspaceId ? (
          <View style={[styles.card, styles.loadingCard]}>
            <Text style={[styles.bodyText, { color: palette.secondaryText }]}>Loading workspace…</Text>
          </View>
        ) : busy && !isRecording ? (
          <View style={[styles.card, styles.loadingCard]}>
            <Text style={[styles.bodyText, { color: palette.secondaryText }]}>Sending voice to Hermes…</Text>
          </View>
        ) : isRecording ? (
          <View style={[styles.card, styles.recordingActive]}>
            <View style={styles.recordingIndicator}>
              <View style={styles.redDot} />
            </View>
            <Text style={styles.recordingText}>Recording…</Text>
            <Text style={[styles.timer, { color: palette.secondaryText }]}>{recordingDuration}s</Text>
            <Pressable onPress={stopRecording} style={styles.stopButton}>
              <View style={styles.stopIcon}>
                <Text style={styles.stopText}>⏹</Text>
              </View>
              <View style={styles.stopLabel}>
                <Text style={[styles.mutedText, { color: palette.secondaryText }]}>Tap to stop</Text>
              </View>
            </Pressable>
          </View>
        ) : transcript || reply ? (
          <View style={[styles.card, styles.transcriptCard, { borderColor: palette.gold, borderWidth: 1.5 }]}>
            <Text style={styles.cardTitle}>You said</Text>
            {transcript ? (
              <Text style={[styles.bodyText, { textAlign: 'center', marginBottom: spacing.sm }]}>{transcript}</Text>
            ) : (
              <Text style={[styles.bodyText, { textAlign: 'center', marginBottom: spacing.sm }]}>Voice message</Text>
            )}

            {reply ? (
              <>
                <Text style={[styles.cardTitle, { marginTop: 8, marginBottom: 4 }]}>Hermes replied</Text>
                <Text style={[styles.replyText, { textAlign: 'center', marginBottom: spacing.sm }]}>{reply}</Text>
                <Pressable onPress={replayVoice} style={styles.playButton}>
                  <Text style={styles.playText}>🔊 Hear it again</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : (
          <Pressable onPress={startRecording} style={styles.micButton}>
            <View style={styles.micIcon}>
              <Text style={styles.micText}>🎤</Text>
            </View>
            <View style={styles.micLabel}>
              <Text style={[styles.mutedText, { color: palette.secondaryText }]}>
                {workspaceId ? 'Tap to record' : 'Loading workspace...'}
              </Text>
            </View>
          </Pressable>
        )}

        {reply && (
          <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 8 }]}>
            Voice sent to Hermes Agent for transcription and reply.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mutedText: {
    color: palette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.primaryText,
    marginBottom: spacing.sm,
  },
  errorCard: {
    marginBottom: 20,
    padding: 16,
  },
  loadingCard: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevated,
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.elevated,
    borderRadius: radius.card,
    paddingVertical: 28,
    paddingHorizontal: 40,
    marginBottom: 20,
    ...shadow.soft,
  },
  micIcon: {
    marginBottom: 8,
  },
  micText: {
    fontSize: 40,
  },
  micLabel: {
    marginTop: 4,
  },
  recordingActive: {
    alignItems: 'center',
    backgroundColor: palette.elevated,
    borderRadius: radius.card,
    padding: 24,
    marginBottom: 20,
    ...shadow.soft,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.critical,
    marginBottom: 12,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.critical,
    margin: 2,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primaryText,
    marginBottom: 4,
  },
  timer: {
    fontSize: 14,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.elevated,
    borderRadius: radius.control,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...shadow.soft,
    marginTop: 8,
  },
  stopIcon: {
    marginRight: 8,
  },
  stopText: {
    fontSize: 20,
  },
  stopLabel: {
    marginTop: 2,
  },
  transcriptCard: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primaryText,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 23,
    color: palette.primaryText,
  },
  replyText: {
    fontSize: 16,
    lineHeight: 23,
    color: palette.primaryText,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  playButton: {
    alignSelf: 'center',
    backgroundColor: palette.gold,
    borderRadius: radius.control,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  playText: {
    color: palette.primaryText,
    fontWeight: '600',
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
  },
});
