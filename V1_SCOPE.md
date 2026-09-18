# AngelOS V1 — the plan (source of product truth)

Written 18 Sep 2026 from Angel. This beats ANGELOS_BRAIN.md, the Grok orchestrator Word doc, and Hermes planner notes when they conflict.

## What V1 is

A **business OS for any owner** (not only PMU, not only Angel's students):
clients, calendar, scheduled posts, DMs, analytics, workflows, automations (by plan),
one friendly **talking** assistant, a free plan.
Like Metricool, plus an assistant and approvals.

Tagline: Where Beauty Meets Intelligence.

## Do not delete features

Every existing AngelOS screen stays. Home lists store tiles first, then all other features.
Hermes Voice is kept as **Talk**. Laptop Hermes / n8n / Telegram are still not the product, but files are not removed.

## Plans

1. Free — custom workflows
2. Automations — higher plan
3. Open-source AI (Ollama) — no credits — not wired yet
4. Full — OpenAI on Angel's key + automations + talking voice. Founder = this.

## Home

Store: Clients · Calendar · Messages · Content · Assistant · Talk · Approvals · Automations · **API Access**
Then every other existing screen.

## API Access

In-app tool: save the live API URL and ping `/health/ready`. `apiFetch` uses that URL.

## Voice

Talking voice is required. It does **not** work in Expo Go. Needs a native iOS build (dev client, then TestFlight).
Microphone permission is in app.json.

## Safety

- Nothing messages a real client until Angel turns a gate on (leave LINE/Meta off)
- No force-push, no delete of GitHub or AngelOS features
- Apple Developer fee only when this V1 actually runs on a phone
- Railway: do not copy Windows node_modules into Docker. Leave the old live API up.

## Later

- V2: artist/client brow tool
- V3: Academy + brand
