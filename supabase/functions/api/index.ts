import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("LIVEKIT_URL")?.trim();
  const apiKey = Deno.env.get("LIVEKIT_API_KEY")?.trim();
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")?.trim();

  if (!url || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: "Live voice is not configured yet. Add LiveKit values to the server environment." }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const ttlFromEnv = Number(Deno.env.get("LIVEKIT_TOKEN_TTL_SECONDS"));
  const ttl = Number.isFinite(ttlFromEnv)
    ? Math.min(Math.max(ttlFromEnv, 60), 3600)
    : 15 * 60;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : undefined;
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : undefined;
  const language = ["ja", "en", "auto"].includes(body.language) ? body.language : "auto";

  const participantIdentity = userId ? `customer-${userId}` : `guest-${crypto.randomUUID()}`;
  const roomName = `angelos-voice-${crypto.randomUUID()}`;

  const grant = {
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  } as any;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: displayName || "AngelOs guest",
    ttl,
    metadata: JSON.stringify({ language, product: "angelos" }),
  });
  token.addGrant(grant);

  const response = {
    serverUrl: url,
    token: token.toJwt(),
    roomName,
    participantIdentity,
    expiresInSeconds: ttl,
    language,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
