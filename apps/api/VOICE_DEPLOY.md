# LiveKit voice backend – final setup (Supabase + Node agent + on-device STT + memory)

This repo has a complete real-time voice pipeline:

- Supabase Edge Functions for tokens and orchestration.
- Mobile app with on-device speech-to-text (Japanese by default) and LiveKit voice.
- Node agent that speaks as Hermes using OpenAI TTS and replies to each turn.
- Supabase table for conversation memory so Hermes remembers context across sessions.

## 1. Secrets (Supabase Edge Functions)

In Supabase dashboard → Edge Functions → Secrets:

- `LIVEKIT_URL` → e.g. `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` → your LiveKit API key
- `LIVEKIT_API_SECRET` → your LiveKit API secret
- `LIVEKIT_TOKEN_TTL_SECONDS` → `900` (optional)
- `OPENAI_API_KEY` → your OpenAI API key

## 2. Database migration (conversation memory)

In Supabase dashboard → SQL Editor:

1. Create a new query.
2. Paste the contents of `supabase/migrations/20260916000000_create_hermes_conversations.sql`.
3. Run it.

This creates the `hermes_conversations` table used by the agent to remember past turns.

## 3. Deploy Edge Functions

### a) Voice session token endpoint

- Path: `supabase/functions/api`
- Supabase: Edge Functions → Functions → Deploy a new function → Via Editor
- Name: `api`
- Paste `supabase/functions/api/index.ts`.
- Save & Deploy.

Endpoint:

```text
POST https://<project-ref>.supabase.co/functions/v1/api/ai/voice/session
```

Returns a temporary LiveKit room token.

### b) Voice agent orchestrator

- Path: `supabase/functions/voice-agent`
- Name: `voice-agent`
- Paste `supabase/functions/voice-agent/index.ts`.
- Save & Deploy.

Add one more secret (optional, for full agent):

- `AGENT_HTTP_BASE_URL` → e.g. `https://agent.yourdomain.com` (your Node agent server)

If this is set, the Edge Function will tell the Node agent to join each room.

## 4. Node voice agent (speaking Hermes with memory)

In `apps/voice-agent`:

1. Create a `.env` file or set environment variables:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
OPENAI_API_KEY=
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
PORT=8787
```

2. Install and run:

```bash
npm install
npm start   # or: node server.js
```

3. Deploy this service somewhere (Render, Railway, Fly, etc.) so it has a public URL, e.g.:
   `https://angelos-voice-agent.onrender.com`

4. In Supabase secrets, set:
   `AGENT_HTTP_BASE_URL = https://angelos-voice-agent.onrender.com`

Now when the mobile app starts a voice session:

1. It calls `/api/ai/voice/session` → gets a room.
2. It calls `/voice-agent` → Edge Function tells the Node agent to join that room (with userId).
3. The Node agent joins, loads past conversation history for that user, says a hello, and listens for `user-speech` data messages.
4. For each user message, Hermes replies with OpenAI, saves the turn to Supabase, and streams TTS audio into the room.

## 5. Mobile app (with on-device speech-to-text)

The mobile app already calls the correct Edge Functions:

- Session: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/api/ai/voice/session`
- Agent: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/voice-agent`

To run the app:

1. In repo root: `npm install`
2. `cd apps/mobile && npm start`
3. Open Hermes Voice screen.
4. Tap **Test session** to verify the Edge Function responds.
5. Tap **Start voice** to join a live room. The screen will show whether the agent joined.
6. Tap the **mic** button and speak in Japanese. Your speech is transcribed on-device and sent to Hermes.
7. Hermes replies with audio in real time and remembers context across sessions.

## 6. Next steps (optional enhancements)

- Add language toggle (Japanese / English) and different TTS voices.
- Improve audio quality and streaming (better TTS voices, sample rate tuning).
- Add wake-word detection or always-listening mode for a more natural feel.
- Add a simple admin UI to view and clear conversation history per user.
