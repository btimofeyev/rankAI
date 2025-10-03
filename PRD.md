RankAI – MVP PRD (AI Search Tracking)
1. MVP Scope (4 Weeks)

Deliver a minimal product that tracks a brand’s visibility in AI search (ChatGPT/GPT-5) over time and compares it with competitors.

2. Core Features
1. Brand Visibility Tracking

Input: Company name + up to 5 keywords.

Process: GPT-5 runs ~20 pre-defined industry queries (e.g. “best AI tutor,” “top educational apps 2025”).

Metrics Captured:

Mention frequency (how many times the brand appears).

Position (ranked first vs buried in the answer).

Sentiment/context (positive/neutral).

2. Competitor Benchmarking

User adds 3–5 competitor brands.

Dashboard shows:

Share of AI Voice (what % of mentions go to each brand).

Side-by-side frequency + position.

Gap queries (competitors mentioned, but not you).

3. Historical Tracking

Weekly refreshes.

Trendline graph: “Mentions over time.”

Alerts when competitor gains/losses happen.

4. Dashboard (Actionable, Not Reports)

Summary Card: “Klio AI mentioned in 3/20 queries (15%), Competitor A: 12/20 (60%).”

Trend Card: Mentions up +2 since last week.

Gap Card: Queries you’re missing.

Action Card: “Competitors dominate on ‘best AI tutor for kids’ → add content targeting that phrase.”

5. Billing (MVP)

Free Tier: 1 analysis/month, limited competitor view.

Pro ($89/mo): Weekly tracking, up to 5 competitors, trends & alerts.

Stripe subscription checkout.

3. Technical Implementation
Backend

Node.js + Express.

Services:

gptQuery.js → runs GPT-5 queries.

parser.js → detects mentions + positions.

insights.js → calculates share of AI voice, gaps, trends.

billing.js → Stripe subscriptions.

Database (Supabase):

users → auth + plan.

analyses → brand + competitors.

queries → query text, response, mentions, positions.

history → weekly snapshots for trendlines.

Frontend (React)

Landing Page: Free “AI Search Visibility Checker.”

Dashboard: 4 cards → Summary, Trends, Gaps, Actions.

Auth: Basic login/signup.

4. User Flow

Free User:

Enter brand + keywords.

Get basic snapshot (brand vs 1 competitor).

CTA → upgrade for trends + full competitor view.

Pro User:

Subscribe via Stripe.

Add brand + 3–5 competitors.

Get weekly refresh + trendline dashboard.

Receive alerts (weekly digest email).

5. Success Metrics

Week 1–2:

Mentions parsed ≥95% accuracy.

Dashboard loads <3s.

Week 3–4:

100+ free analyses run.

≥5 paying users ($445+ MRR).

First trendline data captured (weekly).

Month 2 Goals:

20 paying users ($1,780+ MRR).

500+ free analyses.

Customers engaging with trendline + gap cards.

6. Dev Timeline

Week 1: GPT-5 integration + Supabase schema + parsing.

Week 2: Dashboard + auth + Stripe.

Week 3: Trendline + gap detection + insights.

Week 4: Deployment, beta test, monitoring.

📌 This shifts RankAI from a static audit tool → into a “tracking dashboard” that brands and marketers will log into weekly.
That stickiness = better retention + recurring revenue.