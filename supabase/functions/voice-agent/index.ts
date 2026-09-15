// LiveKit voice agent orchestrator: tells the Node agent to join a room.
// Requires Supabase secrets: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL, OPENAI_API_KEY, AGENT_HTTP_BASE_URL.

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

  const apiKey = Deno.env.get("LIVEKIT_API_KEY")?.trim();
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")?.trim();
  const openAiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  const agentBaseUrl = Deno.env.get("AGENT_HTTP_BASE_URL")?.trim(); // e.g. https://agent.yourdomain.com

  if (!apiKey || !apiSecret || !openAiKey) {
    return new Response(
      JSON.stringify({ error: "Voice agent not configured. Add LIVEKIT_* and OPENAI_API_KEY to Supabase secrets." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const roomName = typeof body.roomName === "string" ? body.roomName : null;
  if (!roomName) {
    return new Response(JSON.stringify({ error: "Missing roomName" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create agent token (for clients that want to know the agent identity).
  const agentGrant = {
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  } as any;

  const agentToken = new AccessToken(apiKey, apiSecret, {
    identity: "hermes-agent",
    name: "Hermes",
    ttl: 60 * 5,
  });
  agentToken.addGrant(agentGrant);

  // If an HTTP agent is configured, tell it to join the room.
  let agentJoined = false;
  if (agentBaseUrl) {
    try {
      const res = await fetch(agentBaseUrl + "/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });
      if (res.ok) agentJoined = true;
    } catch {
      // Ignore; agent join is best-effort.
    }
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      room: roomName,
      agentIdentity: "hermes-agent",
      agentToken: agentToken.toJwt(),
      agentJoined,
      note: agentJoined
        ? "Agent HTTP server notified to join the room."
        : "No AGENT_HTTP_BASE_URL configured; agent did not join.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
