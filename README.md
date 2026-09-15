# ANGELOS_PHASE6

AngelOs – salon operating system.

## Flagship feature: Hermes Voice (with draggable avatar)

Real-time voice AI assistant with:

- 🤖 Draggable Hermes avatar you can move around the screen
- 👂 Tap avatar to make Hermes listen
- 🗣️ On-device Japanese speech-to-text
- 📞 LiveKit real-time voice rooms
- 🧠 OpenAI-powered conversation (Hermes persona)
- 💾 Supabase-backed conversation memory
- 📱 Mobile admin to view/clear history

### Avatar states

- 🤖 Idle (default)
- 👂 Listening (green) — tap avatar to start
- 🤔 Thinking (yellow) — processing your words
- 🗣️ Speaking (blue) — replying to you

### Quick links

- Backend voice setup: [`apps/api/VOICE_DEPLOY.md`](apps/api/VOICE_DEPLOY.md)
- Mobile app: [`apps/mobile/README.md`](apps/mobile/README.md)
- Voice agent: [`apps/voice-agent/`](apps/voice-agent/)
- Supabase functions: [`supabase/functions/`](supabase/functions/)

## Repo structure

- `apps/api` – NestJS backend (base APIs, future expansion)
- `apps/mobile` – Expo mobile app (Hermes voice with draggable avatar, future features)
- `apps/voice-agent` – Node.js Hermes voice agent (STT/LLM/TTS loop)
- `supabase/` – Edge Functions and DB migrations

## Getting started

1. Install dependencies:
   ```bash
   npm install --workspaces --include-workspace-root
   ```
2. Configure Supabase secrets (see `apps/api/VOICE_DEPLOY.md`).
3. Deploy Supabase Edge Functions (`api`, `voice-agent`).
4. Run the Node voice agent (`apps/voice-agent`).
5. Run the mobile app (`apps/mobile`).

More detailed steps are in the individual READMEs above.

## What's built

✅ LiveKit voice sessions
✅ On-device Japanese STT
✅ Hermes agent with multi-turn conversation
✅ Supabase conversation memory
✅ Draggable avatar with tap interactions
✅ Visual states (listening/thinking/speaking)
✅ Mobile admin (view/clear history)
✅ Onboarding + home screens
✅ Full deploy docs

AngelOs voice experience is complete.
