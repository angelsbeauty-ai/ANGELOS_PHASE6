# LiveKit voice backend – minimal deploy notes

This API supports real-time voice via LiveKit. The code is already in `src/voice`.

## Required server environment variables

Set these on your backend host (Render, Railway, Fly, etc.), NOT in GitHub:

- `LIVEKIT_URL` → e.g. `wss://your-project.livekit.cloud`
- `LIVEKIT_API_KEY` → your LiveKit API key
- `LIVEKIT_API_SECRET` → your LiveKit API secret
- `LIVEKIT_TOKEN_TTL_SECONDS` → `900` (optional, default 15 minutes)

## After setting env vars

1. Ensure dependencies are installed: `npm install` (in `apps/api` or workspace root).
2. Rebuild: `npm run build` (in `apps/api`).
3. Restart/redeploy the backend service.

## Test

```bash
curl -X POST https://YOUR_BACKEND_URL/api/ai/voice/session \
  -H "Content-Type: application/json" \
  -d '{"language":"auto"}'
```

Expected response includes `serverUrl`, `token`, `roomName`, `participantIdentity`, `expiresInSeconds`.

## Expo / mobile

The mobile app will call `POST /api/ai/voice/session` and use the returned token to join a LiveKit room for real-time voice with the Hermes agent.
