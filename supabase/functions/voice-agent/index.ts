import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Use environment variable for agent endpoint (set in Supabase dashboard)
  const agentEndpoint = Deno.env.get("AGENT_ENDPOINT")

  if (!agentEndpoint) {
    return new Response(
      JSON.stringify({ error: "AGENT_ENDPOINT not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const body = await req.json()
    const response = await fetch(agentEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    return response
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
