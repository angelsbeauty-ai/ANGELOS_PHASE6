# ANGELOS_PHASE6

**AngelOs is complete.** Salon operating system with flagship AI voice assistant.

## ✨ Hermes Voice — Complete Features

- 🤖 **Draggable avatar** — Move Hermes anywhere on screen
- 👆 **Haptic tap feedback** — Feel every interaction
- 💫 **Pulse animation** — Avatar breathes when speaking
- 👂 **On-device Japanese STT** — Private, fast speech recognition
- 🗣️ **OpenAI TTS** — Natural voice replies
- 📞 **LiveKit real-time** — Low-latency voice rooms
- 🧠 **Conversation memory** — Supabase-backed history
- 📱 **Admin panel** — View/clear conversations
- 🎯 **First-time tutorial** — Instant onboarding
- 🎨 **Dynamic states** — Idle 👂 🤔 🗣️ with color changes

## 📦 What's Built

✅ Full backend (Supabase Edge Functions + Node agent)  
✅ Complete mobile app (Expo, draggable avatar, haptics)  
✅ Voice pipeline (STT → LLM → TTS → audio streaming)  
✅ Database (conversation history with RLS)  
✅ Deploy docs (step-by-step guides)  
✅ Onboarding + home + voice + history screens  

## 🚀 Quick Start

```bash
# 1. Install
npm install --workspaces --include-workspace-root

# 2. Set Supabase secrets (see apps/api/VOICE_DEPLOY.md)
# 3. Deploy Edge Functions (api, voice-agent)
# 4. Run Node agent (apps/voice-agent)
# 5. Run mobile app (apps/mobile)
```

Full docs: `apps/api/VOICE_DEPLOY.md` + `apps/mobile/README.md`

## 🏁 Status

**Production-ready.** All core features implemented and documented.
