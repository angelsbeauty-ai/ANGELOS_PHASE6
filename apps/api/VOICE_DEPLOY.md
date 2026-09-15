# LiveKit voice backend – final setup (Supabase Edge Functions)

This repo now uses Supabase Edge Functions for real-time voice with LiveKit.

## 1. Secrets (already done)

In Supabase dashboard → Edge Functions → Secrets, ensure these four secrets exist:

- `LIVEKIT_URL` → e.g. `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` → your LiveKit API key
- `LIVEKIT_API_SECRET` → your LiveKit API secret
- `LIVEKIT_TOKEN_TTL_SECONDS` → `900` (optional)

## 2. Deploy Edge Functions

Deploy two functions from `supabase/functions`:

### a) Voice session token endpoint

- Path: `supabase/functions/api`
- In Supabase: Edge Functions → Functions → Deploy a new function → Via Editor
- Name: `api`
- Paste `supabase/functions/api/index.ts` as the entire function code.
- Save & Deploy.

This exposes:

```text
POST https://<project-ref>.supabase.co/functions/v1/api/ai/voice/session
```

which returns a temporary LiveKit room token.

### b) Voice agent scaffold (optional, for future)

- Path: `supabase/functions/voice-agent`
- Name: `voice-agent`
- Paste `supabase/functions/voice-agent/index.ts`.
- Save & Deploy.

This is a placeholder to later add a speaking Hermes agent inside LiveKit rooms.

## 3. Mobile app

The mobile app already calls the correct Edge Function URL:

```text
https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/api/ai/voice/session
```

To run the app:

1. In repo root: `npm install`
2. `cd apps/mobile && npm start`
3. Open Hermes Voice screen.
4. Tap **Test session** to verify the Edge Function responds.
5. Tap **Start voice** to join a live room.

## 4. Next steps (optional)

Extend `supabase/functions/voice-agent` to:

- Join the room created by the session endpoint.
- Use an AI provider (OpenAI, etc.) with TTS/STT.
- Speak as Hermes using the existing `HERMES_VOICE_INSTRUCTION` prompt.
