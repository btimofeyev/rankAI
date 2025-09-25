RankAI MVP – ChatGPT Focused PRD (2025)
MVP Scope (4-Week Build)

Build the minimal viable version of RankAI focused exclusively on AI citation tracking in ChatGPT (GPT-5) and simple competitor benchmarking.

MVP Features
1. AI Citation Engine (Core)

Input: Company name + up to 5 keywords.

Process: Query GPT-5 with 20 pre-defined prompts.

Output:

Mention frequency.

Position (first vs buried mentions).

Competitor comparison (side-by-side).

Data: Stored in Supabase, refresh weekly.

2. Simple Dashboard

Landing Page: Free “ChatGPT Visibility Checker.”

Results Page: Show brand mentions vs 3 competitors.

Auth: Basic email signup/login (Supabase).

Export: PDF report summarizing mentions + competitor stats.

3. Competitor Analysis

Manual input (MVP): User enters competitor names.

Comparison View: Frequency + relative positions.

Gap Analysis: Queries where competitors are mentioned, but the brand isn’t.

4. Basic Billing

Free: 1 analysis/month (limited report).

Pro ($89/month): Weekly refresh, 5 competitors, PDF exports.

Stripe Integration: Checkout + subscription.

Technical Implementation
Backend Structure
/root/rankai/
├── src/
│   ├── server.js
│   ├── controllers/
│   │   ├── analysis.js   # GPT-5 queries
│   │   ├── auth.js       # User authentication
│   │   └── billing.js    # Stripe integration
│   ├── services/
│   │   ├── gptQuery.js   # GPT-5 query logic
│   │   ├── competitor.js # Competitor comparison
│   │   └── report.js     # PDF generation
│   └── utils/
│       ├── parser.js     # Mention detection + fuzzy matching
│       └── database.js   # Supabase queries
├── frontend/             # React dashboard
├── public/               # Landing page assets
└── package.json

Database Schema (Supabase)
-- Users
users (id, email, created_at, subscription_tier, stripe_customer_id)

-- Analyses
analyses (id, user_id, brand_name, industry, created_at, results_json)

-- Queries
queries (id, analysis_id, query_text, response_text, mentions_found, positions, sentiment)

-- Competitors
competitors (id, analysis_id, competitor_name, mention_count, avg_position)

AI Integration

Model: GPT-5 (OpenAI API).

Query Templates (20): “best [industry] tools 2025,” “top [industry] platforms,” etc.

Cost Control: Batch queries in a single request, cache results for 24–48h.

Estimated Cost: <$0.50 per full analysis.

Frontend (Minimal React)

Landing Page: Hero + free checker.

Dashboard: Table showing mentions + competitor stats.

Report View: Export to PDF.

Auth: Basic login/signup.

User Flow
Free User

Land on rankai.com.

Enter company + keywords.

Wait 1–2 minutes for analysis.

See partial results (“Your brand: 0 mentions, Competitor A: 6 mentions”).

CTA → signup for full competitor report.

Paid User

Subscribe via Stripe.

Enter brand + up to 5 competitors.

Weekly digest email + dashboard updates.

Export branded PDF reports.

Success Metrics

Week 1–2 (Tech Validation):

GPT-5 queries work reliably.

Mention parsing ≥95% accurate.

Dashboard loads <3s.

PDF export functional.

Week 3–4 (Market Validation):

100+ free analyses run.

10% conversion to signup.

≥5 paying customers ($445+ MRR).

Month 2 Goals:

20 paying customers ($1,780 MRR).

500+ free analyses.

≥15% email → paid conversion.

Development Timeline

Week 1: GPT-5 integration + Supabase schema + parsing.

Week 2: Landing page, dashboard, auth, Stripe.

Week 3: PDF export, email digest, performance polish.

Week 4: Deploy domain, monitoring/logging, beta test.

Resource Requirements

Server: DigitalOcean droplet.

Domain: rankai.com.

API: GPT-5 (~$200/month).

Database: Supabase.

Dev Time: ~130 hours (4 weeks).

Launch Strategy

Soft Launch (Week 1 post-build): 10 beta users.

Public Launch (Week 2): Product Hunt + LinkedIn demo.

Growth (Week 3–4): SEO blog, free checker promotion, outreach to SaaS/E-com.