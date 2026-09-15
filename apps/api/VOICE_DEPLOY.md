# LiveKit voice backend – final setup (Supabase Edge Functions)

This repo now uses Supabase Edge Functions for real-time voice with LiveKit and a scaffold for a speaking Hermes agent.

## 1. Secrets (already done)

In Supabase dashboard → Edge Functions → Secrets, ensure these secrets exist:

- `LIVEKIT_URL` → e.g. `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` → your LiveKit API key
- `LIVEKIT_API_SECRET` → your LiveKit API secret
- `LIVEKIT_TOKEN_TTL_SECONDS` → `900` (optional)
- `OPENAI_API_KEY` → your OpenAI API key (for Hermes intelligence and TTS/STT later)

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

### b) Voice agent scaffold

- Path: `supabase/functions/voice-agent`
- Name: `voice-agent`
- Paste `supabase/functions/voice-agent/index.ts`.
- Save & Deploy.

The mobile app calls this to ask Hermes to join the same room. It currently returns an agent token and a note; the full audio loop runs in the Node agent below.

## 3. Mobile app

The mobile app already calls the correct Edge Function URLs:

- Session: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/api/ai/voice/session`
- Agent: `https://hhzegavoyuicclsmrkwf.supabase.co/functions/v1/voice-agent`

To run the app:

1. In repo root: `npm install`
2. `cd apps/mobile && npm start`
3. Open Hermes Voice screen.
4. Tap **Test session** to verify the Edge Function responds.
5. Tap **Start voice** to join a live room. The screen will show whether the agent joined.

## 4. Node voice agent (optional, for full speech)

To have Hermes actually speak back in the room:

1. Go to `apps/voice-agent`.
2. Set environment variables:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `OPENAI_API_KEY`
3. Run:
   ```bash
   npm install
   npm start
   ```
4. Extend `index.js` to:
   - Accept a room name (via CLI arg or small HTTP endpoint).
   - Join that room as `hermes-agent`.
   - Implement STT → OpenAI (Hermes prompt) → TTS → publish audio back to the room.

This Node agent is where the real-time audio loop lives; the Edge Functions handle tokens and orchestration.

## 5. Next steps

- Implement the full audio loop in `apps/voice-agent/index.js` (STT, LLM, TTS, audio publish).
- Optionally expose a small HTTP endpoint in that service so the agent can be told which room to join.
- Test end-to-end: start a session in the app, ensure the agent joins, and verify you hear Hermes speak.
