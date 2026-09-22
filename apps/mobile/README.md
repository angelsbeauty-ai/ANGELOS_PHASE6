# AngelOs Mobile

Expo-based mobile app for AngelOs.

## Quickstart

1. From repo root:
   ```bash
   npm install
   cd apps/mobile
   npm install
   npm start
   ```
2. Open on device/simulator via Expo Go or development build.

## Hermes Voice

- Onboarding: `/hermes-onboarding`
- Voice session: `/hermes-voice`
- Conversation history: `/hermes-history`

Hermes uses:
- On-device speech-to-text (Japanese by default)
- LiveKit real-time voice rooms
- Supabase-backed conversation memory
- Node agent with OpenAI TTS for replies

See `../api/VOICE_DEPLOY.md` for full backend setup.
