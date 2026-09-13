# AngelOS staging bridge 遯ｶ繝ｻnext steps (safe order)

Worktree: `C:\Users\angelica borac\dev\ANGELOS_PHASE6`  
Hermes home: `C:\Users\angelica borac\agents\hermes`  
Do **not** use `Downloads\ANGELOS_FINAL\ANGELOS_PHASE6` for Railway (production-linked).

## Already on branch tip

- Staging API healthy (release `89dd615` era DI fix; confirm `/health` before assuming tip)
- Worker in repo: `scripts/angelos-hermes-worker.js` (defaults to staging API + `dev\ANGELOS_PHASE6`)
- Claim RPC migration **in repo, not applied**: `supabase/migrations/20260910000000_hermes_worker_claim_rpc.sql`
- Read-only checks: `npm run staging:verify-founder`, `npm run staging:verify-workspace`
- Founder bootstrap: `npm run staging:bootstrap-founder` (needs staging Auth user first)

## Recommended order (approval-controlled)

1. Sign into **staging** app so Auth user exists for founder email.
2. `npm run staging:bootstrap-founder` (env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FOUNDER_EMAIL`).
3. Create the one V1 workspace in the staging app UI.
4. `npm run staging:verify-workspace` 遯ｶ繝ｻexpect `ok: true`.
5. When Angelica asks: apply **only** `20260910000000_hermes_worker_claim_rpc.sql` on staging Supabase (not 0016).
6. Run worker: `npm run hermes:worker` with staging env vars.

## Hard fences

- No production Railway / prod Supabase
- No migration 0016 unless explicitly asked
- No live LINE cutover / Meta verification
- No deploy spam 遯ｶ繝ｻonly deploy when a real `apps/api/**` change needs it

## Baseline seed

After a workspace exists: `npm run staging:seed-baseline` (staging Supabase env). Use `SEED_DRY_RUN=true` to preview.

## In-app first-run (preferred for Angelica)

After workspace exists, open **Services** in the mobile app:
- **Add starter PMU services**
- **Set Mon-Sat 10-18 hours**

Same outcome as `npm run staging:seed-baseline`, but owner-facing and approval-friendly.
