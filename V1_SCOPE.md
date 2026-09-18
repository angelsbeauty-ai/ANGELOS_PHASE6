# AngelOS V1 — the plan (source of product truth)

Written 18 Sep 2026 from Angel. This beats ANGELOS_BRAIN.md when they conflict.

## What V1 is

A business OS for **any owner**: clients, calendar, DMs, content, workflows, automations (by plan),
talking assistant, credits meter. Tagline: Where Beauty Meets Intelligence.

## Do not delete features

Every existing screen stays. Laptop Hermes / n8n / Telegram are not the store product; files stay.

## Plans

1. Free — workflows
2. Automations
3. Ollama AI (no OpenAI credits) — not wired yet
4. Full — OpenAI on Angel's key + voice. Founder = this.

## Build slices (ours — not Metricool's 11 networks)

- **A. Credits meter** — each OpenAI chat/voice = 1 credit. Free/Automations = 0. Full/Solo = 200/month. Founder unlimited.
- **B. Connect your accounts** — Instagram + LINE first (Facebook later). Owner connects THEIR accounts. Tokens never shown back. Real send stays OFF until a gate is on.
- **C. Scheduled posting** — draft → approve → schedule → publish to a **connected** account. API already exists; live publish waits on B + gate.
- **D. Trainee month** — Academy students/trainees get **1 month of scheduling free**. Then the paid plan.

**Not V1:** TikTok, YouTube, LinkedIn, X, Pinterest, Threads, competitor spy, Canva, SmartLinks (link-in-bio). Those are Metricool extras.

## Voice

Talking voice needs a native iOS build, not Expo Go. Mic permission is in app.json.

## Safety

- LINE/Meta gates stay OFF until Angel turns them on
- No force-push, no delete
- No new Railway deploys that copy Windows node_modules
