# AngelOS Brain — Master Context

**Source of truth:** [angelsbeauty-ai/angel_personal_agent](https://github.com/angelsbeauty-ai/angel_personal_agent) → `MASTER-PLAN-GROCK-ORCHESTRATOR.docx` (v1.0, Planning blueprint)

**Last updated:** 2026-09-16

---

## About Angel (Founder/Owner)

- **You are Angel** — owner of AngelOS, run Angels Beauty (beauty business) + Angels Beauty Academy (education)
- **Vision:** Voice-first personal AI. Speak to ONE agent. That agent coordinates an orchestrator → delegates to domain agents → returns one clear answer. Reduce typing, screen time, manual coordination.
- **Plan B (confirmed Sept 12):** Build AngelOS first, then Angels Beauty. Users connect their own platform accounts (Meta, Instagram, TikTok, LINE) — account-authorization model like Metricool.
- **AngelOS is the final private owner control center.** Telegram is a temporary remote-control channel only.

---

## The Main Agent, Sub Agents, and Bots

**Main Agent** = the thing you talk to (Grok / Hermes — same thing, different names). Front door. You speak to it, it understands your intent, orchestrates, and gives you one clear answer.

**Sub Agents** = the orchestrator delegates work to these. They coordinate the bots and report back to the Main Agent.

**Bots** = the workers that do the actual work. Three domain bots:
- Angels Beauty bot — manages the beauty business
- Angels Beauty Academy bot — manages academy operations
- AngelOS bot — builds and manages AngelOS and future apps

### Architecture
```
You → voice or text
Main Agent (you talk to this) → AI Agent Orchestrator
  → Sub Agents (coordinate the work)
    → Angels Beauty bot (does the work)
    → Angels Beauty Academy bot (does the work)
    → AngelOS bot (does the work)
  → domain capabilities
  → reports/results
Main Agent gives you one final response
```

- **You speak ONLY to the Main Agent.** You do NOT coordinate sub agents or bots manually.
- **Main Agent** coordinates, delegates, tracks, asks for approval, returns one answer.
- **Sub Agents** receive work from orchestrator, manage bots, report back.
- **Bots** do the actual work across their domains.
- **3 shared capabilities per bot:** Marketing, CRM/inquiries, Builder/maintenance
- **Tech stack:** GitHub (source/branches/PRs), Supabase (DB/auth/storage/realtime), Railway (hosting), Ollama (local AI to avoid paid credits)
- **Secrets:** out of GitHub, use env vars or platform secret storage

### Principles (Hard)

1. **Approval-first while training:** `Prepare → ask approval → execute → report`
2. **Always require approval for:** sending important messages, publishing/scheduling, contacting leads/customers, changing bookings, changing sensitive CRM data, spending money, changing prices/offers/policies, editing production apps/websites, pushing/merging code, deploying, deleting data/files, sharing private info, changing credentials/permissions/security
3. **May prepare without approval:** research, drafts, plans, reports, data analysis, code in private branch, test results, automation recommendations
4. **Confidence policy:** 90-100% → report to orchestrator; 50-89% → domain agent review/retry; <50% → domain agent investigation/reassignment. Confidence does NOT override approval.
5. **Standard report format:** `STATUS / TASK / ACTION / RESULT / CONFIDENCE / ISSUES / APPROVAL / NEXT` + evidence
6. **Learning rules:** Mistake → user correction → Main Agent proposes rule → user confirms → rule stored (scope: global / Angels Beauty / Academy / AngelOS / capability / bot). Rules include scope, wording, date, source, confirmation.
7. **Voice-first, text-first-for-reliability:** Phone mic → STT → Main Agent → orchestrator/sub agents/bots → Main Agent response → TTS → phone speaker. First implementation may use text chat. Voice added without changing orchestrator design.
8. **Automation disabled by default** until user approves.

---

## Build Phases

| Phase | Focus |
|-------|-------|
| **Phase 1 — Agent foundation** | Conversational front-door agent (text first, voice path prepared), orchestrator foundation, task routing, one test capability/bot, conversation history, Ollama connection, approval + report format, learning-rules storage |
| **Phase 2 — AngelOS agent** | Project management, app development, GitHub tasks, coding/debugging, testing/release prep, AngelOS marketing/CRM foundations |
| **Phase 3 — Angels Beauty agent** | Customer CRM, inquiries/follow-ups, service/booking workflows, marketing content/organic-growth reporting, business reports |
| **Phase 4 — Angels Beauty Academy agent** | Student CRM, course/lesson workflows, academy inquiries, academy marketing, student/course reports |
| **Phase 5 — Voice and automation** | STT, TTS, daily/weekly/monthly workflows, approved content scheduling, automated report delivery, monitoring/retries/escalation |

---

## First Milestone (NOT "build everything")

```
User speaks or types to agent
→ agent sends a task to the orchestrator
→ orchestrator sends it to one test domain agent/capability
→ task returns a confidence-based report
→ agent gives the user one short answer
```

Only after this works → connect the 3 domain agents and real business tools.

### Non-Goals for First Version

Do NOT begin with: many independent bots, fully autonomous publishing, automatic customer messaging, automatic financial actions, production DB deletion, direct pushes to main, complex voice calling, every business integration at once.

---

## Current State (Sept 6 — BUILD_STATUS.md)

| Area | Status |
|------|--------|
| Approvals | BUILT / CONNECTED / INTERNALLY PROVEN |
| Bookings (incl. owner journey) | BUILT / CONNECTED / INTERNALLY PROVEN |
| Messaging core | BUILT / CONNECTED / INTERNALLY PROVEN |
| LINE outbound adapter | CODE READY / TRANSPORT OFF / HUMAN SETUP LATER |
| Meta transport (Instagram/Facebook) | BUILT / INTERNALLY PROVEN — **dormant**, NEEDS FINAL TEST |
| Meta inbound webhook | BUILT — NEEDS FINAL TEST |
| Hermes/Planner control layer | **BUILT / NOT DEPLOYED** (this session) |
| Content Control | Not started (deliberately) |
| Clients/CRM | Built, some routes not called from mobile |

**Meta verification rejected 3 times** (Sept 12). n8n not reachable from this machine (port 5678 refused). Agent (Hermes) healthy on `localhost:8642`. Railway: `angelosapi-production.up.railway.app` (HTTP 200).

---

## What's Built vs. Being Built vs. Planned

| Category | Items |
|----------|-------|
| **Already built** | Backend, mobile app, voice pipeline (STT→LLM→TTS), DB, deploy docs, approvals, bookings, messaging core, LINE adapter (code ready), Meta transport (built/dormant), Meta webhook (built), System Health, Clients/CRM |
| **Being built (this session)** | Main Agent / Planner unified overview + decide endpoints, n8n workflow JSON update, Main Agent Builder executor service |
| **Planned (Master Plan)** | Phase 1: Agent foundation + orchestrator + test capability + Ollama + approval/report format + learning rules. Then Phases 2-5 sequentially. |
| **Future (not current arch)** | Many bots, autonomous publishing, auto customer messaging, auto financial actions, prod DB deletion, direct main pushes, complex voice calling, all integrations at once |

---

## Key IDs

| Item | Value |
|------|-------|
| Workspace ID | `2f420624-2422-4fc3-b00a-f697b68a877d` |
| Supabase project | `hhzegavoyuicclsmrkwf` |
| Railway | `abundant-forgiveness` / `angelosapi-production.up.railway.app` |
| GitHub org | `angelsbeauty-ai` |
| Master plan repo | `angelsbeauty-ai/angel_personal_agent` |
| Agent (Hermes) | `localhost:8642` |
| LiveKit | `wss://builders-23acy5uc.livekit.cloud` |
| LiveKit key | `API6NjLqS3t54AX` |
| Telegram bot (for agent) | connected to "Home" channel (ID: 8744819622) |

---

## Contradictions Flagged

1. **`README.md` says "AngelOs is complete" / "Production-ready"** — contradicts Master Plan which says Phase 1 is just agent foundation + orchestrator loop.
2. **`README.md` lists OpenAI TTS** — Master Plan says **Ollama** is preferred to avoid paid AI API credits.
3. **Current system = single agent (Hermes) with avatar** — Master Plan = front-door agent + orchestrator + 3 domain agents. Different scale, same principle.

---

## Human Setup Items (Cannot be done by AI)

- Meta App setup (developers.facebook.com)
- Telegram bot creation (BotFather)
- n8n credentials setup
- Supabase credential insertion (dashboard)
- Railway env var configuration
- Ollama installation + model setup (Phase 1)

---

## Build Priority Order (when asked "what next")

1. Finish current highest-priority buildable connection task
2. LINE outbound path
3. Meta inbound/outbound path
4. Content approval → publish path
5. Booking full journey connection
6. Shared owner-action layer
7. System status reporting
8. Telegram Planner Bot (only after above are solid)
9. **First: Agent foundation (Phase 1)** — orchestrator + test capability + Ollama + approval/report format + learning rules

**Never jump ahead of the real end-to-end loop:** Client message → AngelOS → AI draft → approval → correct channel send → result recorded.
