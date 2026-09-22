import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { SpeechRecognitionEvent } from 'expo-speech-recognition';

export function useSpeechToText({ language = 'ja-JP' }: { language?: string } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SpeechRecognition.setAvailableLanguages([language]);
    return () => {
      SpeechRecognition.stopRecognition();
    };
  }, [language]);

  const startListening = useCallback(() => {
    setIsListening(true);
    setError(null);
    setTranscript('');

    SpeechRecognition.startRecognition({
      locale: language,
      onResults: (event: SpeechRecognitionEvent) => {
        if (event.results && event.results.length > 0) {
          const text = event.results[0][0].transcript;
          setTranscript(text);
        }
      },
      onError: (e: any) => {
        setError(e?.message || 'Speech recognition error');
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  }, [language]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopRecognition();
    setIsListening(false);
  }, []);

  return { isListening, transcript, error, startListening, stopListening, setTranscript };
}
