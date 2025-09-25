# RankAI MVO Roadmap

## Phase 0 – Stabilize the codebase
- [ ] Replace local JSON storage with Supabase (schema, migrations, connection pooling)
- [x] Move secrets + plan limits into environment-based config (dotenv + deployment overrides)
- [x] Add error logging + structured request logs (pino/winston) across the API

## Phase 1 – Production-grade analysis pipeline
- [ ] Swap GPT stubs for real OpenAI calls with batching, retries, and cost guardrails
- [ ] Introduce async job queue for long-running analyses (BullMQ / lightweight worker)
- [ ] Implement caching layer for 24–48h prompt reuse (Redis or Supabase table with TTL)
- [ ] Harden mention parsing with deterministic tests + fallback heuristics

## Phase 2 – Data persistence & refresh cadence
- [ ] Persist prompt/mention details in Supabase with indices for reporting
- [ ] Build weekly refresh scheduler (cron + job queue) with per-user limits
- [ ] Generate digest emails summarizing changes week-over-week
- [ ] Backfill seed data + sample competitors for demo accounts

## Phase 3 – Billing & entitlements
- [ ] Integrate real Stripe Checkout + webhooks (subscription sync, downgrade path)
- [ ] Enforce plan entitlements server-side (usage counters, competitor caps)
- [ ] Add in-app upgrade prompts + billing settings view (frontend)

## Phase 4 – Dashboard polish
- [ ] Add charts for mention trend + share-of-voice (Chart.js/Recharts)
- [ ] Surface job status + run history states (loading, in-progress badges)
- [ ] Improve empty/error states and global toasts for API failures
- [ ] Enable Pro-only downloads with PDF template redesign (better typography + logo)

## Phase 5 – Operations & launch
- [ ] Write end-to-end smoke + regression tests (Playwright or Cypress)
- [ ] Create deployment pipeline (Render/Fly/DO) with staging + production environments
- [ ] Add monitoring/alerting (Logflare, Cron checks, status page)
- [ ] Document API usage, onboarding checklist, and support runbook
