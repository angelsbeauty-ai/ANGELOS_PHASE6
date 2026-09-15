# LiveKit voice backend – final setup (Supabase + Node agent)

This repo has a complete real-time voice pipeline with multi-turn conversation:

- Supabase Edge Functions for tokens and orchestration.
- Mobile app that joins LiveKit rooms and sends user speech as data messages.
- Node agent that speaks as Hermes using OpenAI TTS and replies to each turn.

## 1. Secrets (Supabase Edge Functions)

In Supabase dashboard → Edge Functions → Secrets:

- `LIVEKIT_URL` → e.g. `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` → your LiveKit API key
- `LIVEKIT_API_SECRET` → your LiveKit API secret
- `LIVEKIT_TOKEN_TTL_SECONDS` → `900` (optional)
- `OPENAI_API_KEY` → your OpenAI API key

## 2. Deploy Edge Functions

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

## 3. Node voice agent (speaking Hermes)

In `apps/voice-agent`:

1. Create a `.env` file or set environment variables:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
OPENAI_API_KEY=
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
2. It calls `/voice-agent` → Edge Function tells the Node agent to join that room.
3. The Node agent joins, says a short hello, and listens for `user-speech` data messages.
4. For each user message, Hermes replies with OpenAI and streams TTS audio into the room.

## 4. Mobile app

The mobile app already calls the correct Edge Functions:

- Session: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/api/ai/voice/session`
- Agent: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/voice-agent`

To run the app:

1. In repo root: `npm install`
2. `cd apps/mobile && npm start`
3. Open Hermes Voice screen.
4. Tap **Test session** to verify the Edge Function responds.
5. Tap **Start voice** to join a live room. The screen will show whether the agent joined.
6. While connected, type what you said in the text box and tap **Send**. Hermes will reply with audio.

## 5. Next steps (optional enhancements)

- Replace the text box with real STT (e.g. device speech-to-text or LiveKit audio transcription).
- Add conversation memory across sessions (store history in Supabase DB).
- Add Japanese voice and localization using the existing `language` field.
- Improve audio quality and streaming (use better TTS voices, adjust sample rates, etc.).
