# RankAI MVP

Full-stack MVP for tracking brand visibility inside AI-generated answers. Built from the PRD requirements.

## Stack
- **Backend**: Node.js + Express, Supabase (or in-memory fallback), OpenAI GPT-5, Stripe
- **Frontend**: React + Vite, TypeScript, minimal modern UI kit (Tailwindless)

## Getting Started

```bash
cp backend/.env.example backend/.env
# set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, STRIPE_SECRET_KEY

cd backend
npm install
npm run dev

cd ../frontend
npm install
npm run dev
```

Create `frontend/.env` with:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
# VITE_API_BASE=https://api.rankai.com/api (set when deploying)
```

Backend serves REST API under `/api`. Frontend expects API at `http://localhost:4000` by default.

Supabase schema tables:
- `user_plans` (user_id, plan_tier, plan_renews_at)
- `analyses` (id, user_id, brand, keywords[], competitors[], created_at)
- `queries` (id, analysis_id, query_text, brand, position, sentiment, context, run_at)
- `history` (id, analysis_id, week, brand_mentions, competitor_mentions)

Stripe plan ID placeholder: `price_rankai_pro`.

OpenAI model uses `gpt-5` with low reasoning effort for optimal speed and accuracy; fallback synthetic data is provided for local dev without an API key.

### GPT-5 Integration
- Model: `gpt-5` via OpenAI Chat Completions API
- Configuration: `reasoning_effort: 'low'` and `verbosity: 'low'` for faster responses
- Query Set: ~20 pre-defined industry queries automatically combined with user keywords
- Structured outputs with JSON schema validation
- Automatic fallback to mock data when `OPENAI_API_KEY` is not set

### Auth
- Supabase Auth (email + password) powers signup, login, and session management.
- Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend client.
- Backend validates requests via Supabase JWTs; `user_plans` keeps plan metadata keyed by auth user id.
