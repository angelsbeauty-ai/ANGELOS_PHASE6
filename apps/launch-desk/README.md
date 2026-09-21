# Launch Desk

Launch Desk is a server-backed launch-planning agent built with the current OpenAI Agents SDK for TypeScript.

## What it does
Enter a product brief, audience, launch date, constraints, and available assets. Launch Desk produces a prioritized release plan, risk register, owner checklist, channel-specific launch copy, and focused follow-up questions.

## Structure
- src/ — React/Vite frontend
- server/agent.ts — Agents SDK agent configuration
- server/tools.ts — function tools
- server/index.ts — Express API + SSE stream
- scripts/verify-stream.ts — real streamed API verification
- VALIDATION.md — behavior and verification checklist

The app lives under apps/launch-desk so the existing AngelOS API and mobile app remain isolated.

## Current OpenAI pattern
The implementation uses @openai/agents with Zod function tools, run(...,{stream:true}), the full SDK event stream, and server-side tracing. OpenAI's Agents SDK documents this Agent/run/tool/streaming pattern and built-in server tracing.

At implementation time, @openai/agents 0.18.0 is the current npm release. The default model is gpt-5.6-luna for a cost-sensitive planning workload. Set OPENAI_MODEL to another supported model when needed.

## Setup
Requirements: Node.js 22+ and an OpenAI API key.

From the repository root:
```
cd apps/launch-desk
npm install
```

Create .env:
```
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
PORT=3180
```
Never commit .env.

## Run
```
npm run dev
```
Frontend: http://localhost:5178
API: http://localhost:3180

## Real API verification
Start the API with a real OPENAI_API_KEY, then run:
```
npm run verify:stream
```
The verifier POSTs to /api/launch-plan, consumes the SSE stream to completion, and fails unless it sees at least one tool_progress event and at least one text_delta event. This is intentionally stronger than /api/health, TypeScript, or unit tests.

## Tests
```
npm test
npm run build
```

## Extending
Add a function tool in server/tools.ts, export it in launchTools, and add instructions describing when it should be used. For specialist workflows, use Agents SDK agent-as-tool or handoff patterns instead of adding another HTTP layer. Keep external side effects behind explicit application code.

## Official docs
https://developers.openai.com/api/docs/models
https://openai.github.io/openai-agents-js/
https://openai.github.io/openai-agents-js/guides/streaming/
https://openai.github.io/openai-agents-js/guides/tracing/
