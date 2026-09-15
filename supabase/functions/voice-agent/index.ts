// Minimal LiveKit voice agent for Hermes (placeholder).
// This file is a scaffold; a full agent needs an AI provider (e.g. OpenAI) and TTS/STT.
// For now, it just logs room events and can be extended to speak as Hermes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // This endpoint can be extended to:
  // 1. Accept a room name from the client.
  // 2. Join that room as an agent using LiveKit server SDK.
  // 3. Listen for audio, call Hermes/OpenAI, and speak back.

  return new Response(
    JSON.stringify({
      status: "ok",
      note: "Voice agent scaffold deployed. Extend this function to join rooms and speak as Hermes.",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
