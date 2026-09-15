// LiveKit voice agent for Hermes: joins a room, listens, and speaks back using OpenAI.
// Requires Supabase secrets: OPENAI_API_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken, RoomServiceClient } from "https://esm.sh/livekit-server-sdk@2.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HERMES_SYSTEM = `You are Hermes, the AngelOS AI voice assistant. Speak in short, natural sentences (1–3 sentences). Be calm, helpful, and concise. You are talking to a user over voice in real time.`;

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
  const url = Deno.env.get("LIVEKIT_URL")?.trim();
  const openAiKey = Deno.env.get("OPENAI_API_KEY")?.trim();

  if (!apiKey || !apiSecret || !url || !openAiKey) {
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

  // Create agent token so this function can join the room as "hermes-agent"
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

  // For now, return the token and a simple plan; actual audio loop needs a long-lived process.
  // A full real-time loop (STT → LLM → TTS → publish audio) is better run as a separate Node service.
  // This endpoint gives the client what it needs to know the agent is ready.

  return new Response(
    JSON.stringify({
      status: "ok",
      room: roomName,
      agentIdentity: "hermes-agent",
      agentToken: agentToken.toJwt(),
      note: "Agent scaffold ready. For full audio loop, run a Node agent that joins this room and uses OpenAI TTS/STT.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
