# Deployment & Ops

## Prerequisites
- Node.js 20+
- Supabase project with tables from `backend/supabase/schema.sql` (auth handled by Supabase Auth).
- Configure Supabase Auth (email/password) and ensure policies restrict access to `user_plans`, `analyses`, `queries`, and `history`.
- OpenAI API key with access to `gpt-4o-mini` (or adjust model in `gptQuery.ts`)
- Stripe account with a recurring price (update `PRICE_ID` in `billing.ts`)
- Optional email provider (Resend/SendGrid) if replacing the console-based digest sender

## Environment Variables
Copy `backend/.env.example` and populate:

```
PORT=4000
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_ORIGIN=https://app.rankai.com
```

Frontend reads API URL through the Vite proxy; for production set `VITE_API_BASE` if hosting separately and adjust `api/index.ts`.
Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the web app so Supabase Auth can run client-side.

## Local Development

```bash
# Backend
yarn --cwd backend install
yarn --cwd backend dev

# Frontend
yarn --cwd frontend install
yarn --cwd frontend dev
```

Backend runs at `http://localhost:4000`, frontend at `http://localhost:5173`.

## Production Build

```bash
# Build backend
cd backend
yarn build

# Build frontend
cd ../frontend
yarn build
```

Serve the backend (Express) behind a process manager (PM2/Fly/Render). Deploy the frontend to Vercel/Netlify/S3 with the built `dist/`.

Configure HTTPS and CORS allowing the frontend origin.

## Scheduled Refresh
- The weekly refresh uses `node-cron` (Monday 08:00 UTC). Ensure the process stays warm (use background worker).
- For Supabase, consider migrating the cron job to Supabase Scheduled Functions or a serverless cron hitting `/api/admin/refresh` (add route).

## Stripe Webhooks
- Create a webhook endpoint (e.g., `/api/billing/webhook`) to sync subscription status. The current fallback instantly upgrades when Stripe is not configured – replace before charging real customers.

## QA Checklist
- Run `npm run test` in both `backend` and `frontend`.
- Verify `POST /api/analysis` rejects free users after one run and >1 competitor.
- Confirm dashboard cards render after a manual analysis and that the upgrade button redirects to the Stripe checkout URL (or mock success URL when Stripe keys are missing).
- Manually inspect console logs for weekly digest composition (`Weekly digest composed`). Replace with email service before launch.
