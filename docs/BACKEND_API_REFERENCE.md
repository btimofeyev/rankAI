# Backend API Reference

Complete API documentation for the rankAI backend service.

**Base URL:** `http://localhost:4000/api` (development)

**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health Endpoints](#health-endpoints)
3. [Project Endpoints](#project-endpoints)
4. [Query Endpoints](#query-endpoints)
5. [Billing Endpoints](#billing-endpoints)
6. [Analysis Endpoints](#analysis-endpoints-legacy)
7. [Service Functions](#service-functions)
8. [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require JWT authentication via Supabase.

### Authentication Header

```http
Authorization: Bearer <jwt_token>
```

### Getting Auth Token

1. Sign up or sign in via `/api/auth/sign-up` or `/api/auth/sign-in`
2. Supabase client automatically manages JWT tokens
3. Extract token: `supabase.auth.getSession()`

### Middleware

**Location:** `backend/src/middleware/auth.ts`

Extracts user from JWT and attaches to `req.user`:

```typescript
req.user = {
  id: string,      // User UUID
  email: string    // User email
}
```

---

## Health Endpoints

### GET `/health`

Check API health status.

**Authentication:** None

**Response:** `200 OK`

```json
{
  "status": "ok"
}
```

**Example:**

```bash
curl http://localhost:4000/api/health
```

---

## Project Endpoints

### POST `/projects`

Create a new brand tracking project.

**Authentication:** Required

**Request Body:**

```typescript
{
  brandName: string,        // Required, 1-100 characters
  keywords: string[],       // Required, 1-20 items
  competitors: string[],    // Required, 0-5 (free) or 0-20 (pro)
  queries: string[]         // Required, 1-20 items
}
```

**Validation:**
- `brandName`: Non-empty, max 100 chars
- `keywords`: Array with 1-20 items
- `competitors`: Array with 0-5 items (free tier) or 0-20 items (pro tier)
- `queries`: Array with 1-20 items

**Response:** `201 Created`

```json
{
  "project": {
    "id": "uuid",
    "userId": "uuid",
    "brandName": "Stripe",
    "keywords": ["payment", "processor"],
    "competitors": ["PayPal", "Square"],
    "trackedQueries": ["What's the best payment processor?"],
    "createdAt": "2025-10-13T10:00:00.000Z",
    "updatedAt": "2025-10-13T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `403` - Plan limit exceeded (free tier: 1 competitor max)
- `401` - Unauthorized

**Example:**

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Stripe",
    "keywords": ["payment processor", "SaaS"],
    "competitors": ["PayPal", "Square"],
    "queries": ["Best payment processor for SaaS?"]
  }'
```

---

### GET `/projects`

Get all projects for authenticated user.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "projects": [
    {
      "id": "uuid",
      "userId": "uuid",
      "brandName": "Stripe",
      "keywords": ["payment", "processor"],
      "competitors": ["PayPal", "Square"],
      "trackedQueries": ["Best payment processor?"],
      "createdAt": "2025-10-13T10:00:00.000Z",
      "updatedAt": "2025-10-13T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/projects/:projectId`

Get project details with analysis runs and dashboard data.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "project": {
    "id": "uuid",
    "userId": "uuid",
    "brandName": "Stripe",
    "keywords": ["payment", "processor"],
    "competitors": ["PayPal", "Square"],
    "trackedQueries": ["Best payment processor?"],
    "createdAt": "2025-10-13T10:00:00.000Z",
    "updatedAt": "2025-10-13T10:00:00.000Z"
  },
  "runs": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "runAt": "2025-10-13T11:00:00.000Z",
      "queriesGenerated": 5
    }
  ],
  "dashboard": {
    "summaryCard": {
      "brandMentions": 15,
      "totalQueries": 20,
      "queriesWithMentions": 12,
      "shareOfVoice": {
        "Stripe": 45.5,
        "PayPal": 30.2,
        "Square": 24.3
      }
    },
    "trendCard": {
      "series": [
        {
          "week": "Oct 01",
          "value": 10,
          "Stripe": 5,
          "PayPal": 3,
          "Square": 2
        }
      ],
      "delta": 5
    },
    "gapCard": [
      {
        "query": "Best international payment processor?",
        "dominatingCompetitor": "PayPal",
        "recommendation": "PayPal ranks #1, you're absent",
        "gapType": "missing"
      }
    ],
    "actionCard": [
      "🎯 Critical: 3 queries have zero brand visibility. Start with: 'Best payment processor for startups?'"
    ],
    "sentimentCard": {
      "positive": 10,
      "neutral": 3,
      "negative": 2
    }
  },
  "totalQueries": 20
}
```

**Error Responses:**
- `404` - Project not found
- `403` - Not authorized to access project
- `401` - Unauthorized

---

### PATCH `/projects/:projectId`

Update project configuration.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Request Body:**

```typescript
{
  keywords?: string[],      // Optional, 1-20 items
  competitors?: string[]    // Optional, 0-5 (free) or 0-20 (pro)
}
```

**Response:** `200 OK`

```json
{
  "project": {
    "id": "uuid",
    "userId": "uuid",
    "brandName": "Stripe",
    "keywords": ["payment", "gateway", "SaaS"],
    "competitors": ["PayPal", "Square", "Braintree"],
    "trackedQueries": ["Best payment processor?"],
    "createdAt": "2025-10-13T10:00:00.000Z",
    "updatedAt": "2025-10-13T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `403` - Plan limit exceeded or not authorized
- `404` - Project not found

---

### DELETE `/projects/:projectId`

Delete a project and all associated data.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "success": true
}
```

**Error Responses:**
- `404` - Project not found
- `403` - Not authorized to delete project

---

### POST `/projects/:projectId/analyze`

Run brand visibility analysis on project's tracked queries.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Request Body:** None

**Rate Limits:**
- Free tier: 1 analysis per 30 days per project
- Pro tier: Unlimited

**Response:** `200 OK`

```json
{
  "run": {
    "id": "uuid",
    "projectId": "uuid",
    "runAt": "2025-10-13T12:00:00.000Z",
    "queriesGenerated": 10
  },
  "dashboard": {
    "summaryCard": { /* ... */ },
    "trendCard": { /* ... */ },
    "gapCard": [ /* ... */ ],
    "actionCard": [ /* ... */ ],
    "sentimentCard": { /* ... */ }
  },
  "totalQueries": 30
}
```

**Processing:**
1. Validates plan limits
2. Fetches tracked queries
3. Runs AI analysis on each query (batches of 5)
4. Extracts brand mentions, positions, sentiment
5. Saves results with citations
6. Creates snapshot for trend tracking
7. Builds cumulative dashboard

**Error Responses:**
- `403` - Rate limit exceeded (free tier: "Next analysis available after [date]")
- `404` - Project not found
- `500` - Analysis failed

**Example:**

```bash
curl -X POST http://localhost:4000/api/projects/abc123/analyze \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET `/projects/:projectId/runs`

Get all analysis runs for a project.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "runs": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "runAt": "2025-10-13T12:00:00.000Z",
      "queriesGenerated": 10
    }
  ]
}
```

---

## Query Endpoints

### GET `/projects/:projectId/queries`

Get all query results for a project.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "queries": [
    {
      "id": "uuid",
      "runId": "uuid",
      "queryText": "Best payment processor for SaaS?",
      "brand": "Stripe",
      "position": 1,
      "sentiment": "positive",
      "context": "...Stripe is widely regarded as the best payment...",
      "responseText": "When it comes to payment processors...",
      "citations": [
        {
          "url": "https://example.com/article",
          "title": "Best Payment Processors 2025",
          "domain": "example.com",
          "snippet": "Stripe leads the market..."
        }
      ],
      "usedWebSearch": true,
      "runDate": "2025-10-13T12:00:00.000Z"
    }
  ]
}
```

---

### GET `/projects/:projectId/query-performance`

Get aggregated performance metrics for each query.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "performance": [
    {
      "query": "Best payment processor for SaaS?",
      "totalAppearances": 8,
      "brandAppearances": 7,
      "appearanceRate": 87.5,
      "avgPosition": 1.5,
      "bestPosition": 1,
      "worstPosition": 3,
      "sentiment": {
        "positive": 6,
        "neutral": 1,
        "negative": 0
      },
      "competitorData": {
        "PayPal": {
          "appearances": 5,
          "avgPosition": 2.5,
          "trendData": [1, 1, 0, 1, 1, 0, 1, 0, 1, 1]
        },
        "Square": {
          "appearances": 3,
          "avgPosition": 3.2,
          "trendData": [0, 1, 0, 0, 1, 0, 1, 0, 0, 0]
        }
      },
      "isTracked": true,
      "citations": [
        {
          "url": "https://example.com/article",
          "title": "Best Payment Processors 2025",
          "domain": "example.com",
          "snippet": "Stripe leads the market..."
        }
      ],
      "usedWebSearch": true,
      "trendData": [1, 1, 1, 0, 1, 1, 1, 0, 1, 1]
    }
  ]
}
```

**Metrics Explanation:**
- `totalAppearances`: Total times brand was mentioned
- `brandAppearances`: Unique runs where brand appeared
- `appearanceRate`: Percentage of runs with brand mention
- `avgPosition`: Average position when mentioned (lower is better)
- `trendData`: Last 10 runs (1 = appeared, 0 = absent)

---

### GET `/projects/:projectId/query-suggestions`

Get AI-powered and data-driven query suggestions.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Response:** `200 OK`

```json
{
  "suggestions": [
    {
      "query": "Best payment processor for international transactions?",
      "score": 95,
      "reason": "Critical gap - PayPal appears but Stripe is absent",
      "category": "zero_visibility",
      "metadata": {
        "competitorMentions": 5,
        "competitorName": "PayPal",
        "brandMissing": true
      }
    },
    {
      "query": "Stripe vs PayPal for e-commerce",
      "score": 72,
      "reason": "PayPal appears 80% vs your 40%",
      "category": "competitor_gap",
      "metadata": {
        "competitorName": "PayPal",
        "brandMissing": false,
        "avgPosition": 2,
        "appearanceRate": 40
      }
    },
    {
      "query": "Most reliable payment gateway for SaaS",
      "score": 55,
      "reason": "Strong performer - 85% appearance, avg #1 position",
      "category": "high_performer",
      "metadata": {
        "brandMissing": false,
        "avgPosition": 1.2,
        "appearanceRate": 85
      }
    },
    {
      "query": "What's the best payment processor for small business?",
      "score": 48,
      "reason": "AI-generated suggestion based on your brand and keywords",
      "category": "related",
      "metadata": {
        "brandMissing": true,
        "appearanceRate": 0
      }
    }
  ]
}
```

**Category Scoring:**
- `zero_visibility`: 90-100 (critical gaps)
- `competitor_gap`: 60-80 (competitive threats)
- `high_performer`: 40-60 (optimize winners)
- `related`: 25-55 (AI-generated or keyword-based)

**Algorithm:**
1. If historical data exists: analyze for gaps and opportunities
2. If low diversity: call OpenAI for suggestions
3. Fallback: keyword-based templates

---

### GET `/projects/:projectId/query-trends/:queryText`

Get detailed trend analysis for a specific query over time.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID
- `queryText` (string, required): URL-encoded query text

**Response:** `200 OK`

```json
{
  "trends": {
    "query": "Best payment processor for SaaS?",
    "dataPoints": [
      {
        "date": "2025-10-01T12:00:00.000Z",
        "runId": "uuid",
        "appeared": true,
        "position": 1,
        "sentiment": "positive",
        "context": "...Stripe is the best...",
        "competitorPositions": {
          "PayPal": 2,
          "Square": null
        }
      },
      {
        "date": "2025-10-08T12:00:00.000Z",
        "runId": "uuid",
        "appeared": true,
        "position": 2,
        "sentiment": "neutral",
        "context": "...Stripe and PayPal are...",
        "competitorPositions": {
          "PayPal": 1,
          "Square": 3
        }
      }
    ],
    "overallStats": {
      "totalRuns": 10,
      "appearanceCount": 8,
      "appearanceRate": 80,
      "avgPosition": 1.5,
      "bestPosition": 1,
      "worstPosition": 3,
      "trendDirection": "up",
      "sentimentBreakdown": {
        "positive": 6,
        "neutral": 2,
        "negative": 0
      }
    },
    "competitorComparison": {
      "PayPal": {
        "appearanceCount": 7,
        "avgPosition": 2.1
      },
      "Square": {
        "appearanceCount": 4,
        "avgPosition": 3.5
      }
    }
  }
}
```

**Trend Direction Calculation:**
- Compare first half vs second half of data points
- `diff > 0.1` → `"up"`
- `diff < -0.1` → `"down"`
- Otherwise → `"stable"`

**Example:**

```bash
curl "http://localhost:4000/api/projects/abc123/query-trends/Best%20payment%20processor%3F" \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST `/projects/:projectId/tracked-queries`

Add a single query to the project's tracked queries.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Request Body:**

```json
{
  "query": "What's the best payment processor for startups?"
}
```

**Validation:**
- Max 20 tracked queries per project
- No duplicate queries (case-insensitive)

**Response:** `200 OK`

```json
{
  "project": {
    "id": "uuid",
    "userId": "uuid",
    "brandName": "Stripe",
    "keywords": ["payment", "processor"],
    "competitors": ["PayPal", "Square"],
    "trackedQueries": [
      "Best payment processor?",
      "What's the best payment processor for startups?"
    ],
    "createdAt": "2025-10-13T10:00:00.000Z",
    "updatedAt": "2025-10-13T13:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or duplicate query
- `403` - Max queries reached (20)
- `404` - Project not found

---

### POST `/projects/:projectId/tracked-queries/bulk`

Add multiple queries to the project at once.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Request Body:**

```json
{
  "queries": [
    "Best payment processor for SaaS?",
    "Stripe vs PayPal comparison",
    "Most reliable payment gateway"
  ]
}
```

**Validation:**
- Combined total must not exceed 20 queries
- Skips duplicates automatically
- Max 10 queries per request

**Response:** `200 OK`

```json
{
  "project": {
    "id": "uuid",
    "trackedQueries": [ /* updated list */ ],
    /* ... */
  },
  "added": 3
}
```

**Error Responses:**
- `400` - Would exceed max queries (20 total)
- `404` - Project not found

---

### DELETE `/projects/:projectId/tracked-queries`

Remove a query from tracked queries.

**Authentication:** Required

**URL Parameters:**
- `projectId` (string, required): Project UUID

**Request Body:**

```json
{
  "query": "Old query to remove"
}
```

**Response:** `200 OK`

```json
{
  "project": {
    "id": "uuid",
    "trackedQueries": [ /* updated list */ ],
    /* ... */
  }
}
```

**Error Responses:**
- `404` - Project or query not found

---

## Billing Endpoints

### GET `/billing/plan`

Get user's current plan tier.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "tier": "free",
  "renewsAt": null
}
```

Or for pro users:

```json
{
  "tier": "pro",
  "renewsAt": "2025-11-13T10:00:00.000Z"
}
```

---

### POST `/billing/checkout`

Create Stripe checkout session for plan upgrade.

**Authentication:** Required

**Request Body:**

```json
{
  "successPath": "/dashboard?billing=success",
  "cancelPath": "/dashboard?billing=cancelled"
}
```

**Response:** `200 OK`

```json
{
  "url": "https://checkout.stripe.com/session/abc123..."
}
```

**Process:**
1. Creates Stripe checkout session
2. Redirects to Stripe for payment
3. Webhook updates plan on success
4. Redirects to `successPath` or `cancelPath`

**Error Responses:**
- `500` - Stripe session creation failed

---

## Analysis Endpoints (Legacy)

### POST `/analysis`

**⚠️ DEPRECATED:** Use `/projects/:projectId/analyze` instead.

Run brand visibility analysis (legacy single-use endpoint).

**Authentication:** Required

**Request Body:**

```json
{
  "brand": "Stripe",
  "keywords": ["payment", "processor"],
  "competitors": ["PayPal", "Square"]
}
```

**Response:** `200 OK`

Returns same structure as project analyze endpoint.

---

### GET `/dashboard`

**⚠️ DEPRECATED:** Use `/projects/:projectId` instead.

Get dashboard for most recent analysis.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "analysis": { /* ... */ },
  "dashboard": { /* ... */ }
}
```

---

## Service Functions

### GPT Query Service

**Location:** `backend/src/services/gptQuery.ts`

#### `runBrandVisibilityAnalysis()`

Main analysis function that processes queries and extracts brand mentions.

**Signature:**

```typescript
async function runBrandVisibilityAnalysis(
  brand: string,
  keywords: string[],
  competitors: string[],
  trackedQueries?: string[]
): Promise<QueryRun[]>
```

**Parameters:**
- `brand`: Brand name to track
- `keywords`: Industry keywords (used in legacy query generation)
- `competitors`: Competitor brand names
- `trackedQueries`: Specific queries to analyze (required in current implementation)

**Returns:**

```typescript
Array<{
  query: string,
  responseText: string,
  mentions: VisibilityMention[],
  citations?: Citation[],
  usedWebSearch?: boolean
}>
```

**Processing:**
1. Batches queries into groups of 5
2. For each query:
   - Calls `queryWithWebSearch()` or `queryWithoutWebSearch()`
   - Analyzes response for brand mentions
   - Extracts positions, sentiment, context
3. Returns all results (including zero-mention queries)

---

#### `analyzeResponseForMentions()`

Extract brand mentions from AI response text.

**Signature:**

```typescript
function analyzeResponseForMentions(
  query: string,
  responseText: string,
  brands: string[]
): VisibilityMention[]
```

**Parameters:**
- `query`: The query that was asked
- `responseText`: AI-generated response
- `brands`: Array of brand names to search for

**Returns:**

```typescript
Array<{
  query: string,
  brand: string,
  position: number,      // 1-based position
  sentiment: 'positive' | 'neutral' | 'negative',
  context: string        // 50 chars before/after
}>
```

**Algorithm:**
1. **Brand Detection:** Regex with word boundaries: `\b${brand}\b`
2. **Position:** Order of first appearance (1, 2, 3, ...)
3. **Context:** Extract 50 chars before and after mention
4. **Sentiment:** Keyword matching in 100-char window
   - Positive: best, top, great, excellent, leading, popular, recommended
   - Negative: worst, poor, avoid, limited, lacking
   - Default: neutral

---

### Web Search Service

**Location:** `backend/src/services/webSearch.ts`

#### `queryWithWebSearch()`

Get AI response with real-time web search citations.

**Signature:**

```typescript
async function queryWithWebSearch(query: string): Promise<{
  responseText: string,
  citations: Citation[],
  usedWebSearch: boolean
}>
```

**Uses:** OpenAI Responses API with `web_search` tool

---

#### `queryWithoutWebSearch()`

Get AI response without web search (fallback).

**Signature:**

```typescript
async function queryWithoutWebSearch(query: string): Promise<{
  responseText: string,
  citations: Citation[],
  usedWebSearch: boolean
}>
```

**Uses:** OpenAI Chat Completions API

---

### Query Suggestions Service

**Location:** `backend/src/services/querySuggestions.ts`

#### `generateQuerySuggestions()`

Generate intelligent query suggestions using data analysis and AI.

**Signature:**

```typescript
async function generateQuerySuggestions(
  projectId: string,
  brand: string,
  competitors: string[],
  trackedQueries: string[],
  keywords: string[]
): Promise<QuerySuggestion[]>
```

**Algorithm:**
1. Analyze historical data if available
2. Find zero-visibility queries (score: 90-100)
3. Find competitor gaps (score: 60-80)
4. Find high-potential queries (score: 40-60)
5. If low diversity: call OpenAI for suggestions (score: 37-55)
6. Fallback: keyword-based templates (score: 25-50)
7. Sort by score DESC, return top 10

---

### Insights Service

**Location:** `backend/src/services/insights.ts`

#### `buildDashboardSummary()`

Aggregate all analysis data into dashboard cards.

**Signature:**

```typescript
function buildDashboardSummary(
  brand: string,
  competitors: string[],
  allResults: QueryResult[],
  snapshots: ProjectSnapshot[],
  allQueries: string[]
): DashboardCards
```

**Returns:**
- `summaryCard`: Mentions, queries, share of voice
- `trendCard`: Time series data, delta
- `gapCard`: Top 3 gap opportunities
- `actionCard`: Top 4 strategic recommendations
- `sentimentCard`: Sentiment breakdown

---

#### `findGapOpportunities()`

Identify competitive gaps and positioning opportunities.

**Signature:**

```typescript
function findGapOpportunities(
  mentions: VisibilityMention[],
  brand: string,
  competitors: string[],
  allQueries: string[]
): GapOpportunity[]
```

**Gap Types:**
1. **Missing (Type 1):** No brands mentioned at all
2. **Missing (Type 2):** Brand absent but competitor present
3. **Outranked:** Brand present but competitor ranks higher

**Returns top 3 gaps sorted by priority.**

---

### Query Analytics Service

**Location:** `backend/src/services/queryAnalytics.ts`

#### `calculateQueryPerformance()`

Calculate aggregated metrics for each query.

**Signature:**

```typescript
async function calculateQueryPerformance(
  projectId: string,
  brandName: string,
  competitors: string[],
  trackedQueries: string[]
): Promise<QueryPerformance[]>
```

**Calculates:**
- Appearance counts and rates
- Average/best/worst positions
- Sentiment breakdown
- Competitor comparison
- Trend data (last 10 runs)

---

### Repository Service

**Location:** `backend/src/services/repository.ts`

Handles all database operations with Supabase (or in-memory fallback).

**Key Functions:**

- `createProject()` - Create brand project
- `getProject()` - Get project by ID
- `updateProject()` - Update project configuration
- `deleteProject()` - Delete project
- `createAnalysisRun()` - Record new run
- `saveQueryResults()` - Save query results with citations
- `createSnapshot()` - Save trend snapshot
- `addTrackedQuery()` - Add query to tracking
- `removeTrackedQuery()` - Remove query
- `getPlan()` - Get user plan tier
- `setPlan()` - Update plan tier

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Plan limit exceeded, not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Service failure, OpenAI error |

### Common Error Messages

**Authentication Errors:**
```json
{ "error": "Unauthorized" }
```

**Validation Errors:**
```json
{
  "error": "Validation failed",
  "details": "brandName is required"
}
```

**Plan Limit Errors:**
```json
{
  "error": "Free tier limited to 1 competitor. Upgrade to Pro for up to 20 competitors."
}
```

```json
{
  "error": "Analysis rate limit: Next analysis available after 2025-11-12"
}
```

**Not Found Errors:**
```json
{ "error": "Project not found" }
```

---

## Rate Limits

### Free Tier
- 1 competitor per project
- 1 analysis per 30 days per project
- 20 tracked queries per project

### Pro Tier
- 20 competitors per project
- Unlimited analyses
- 20 tracked queries per project

---

## Database Schema

### Tables

**`brand_projects`**
```sql
CREATE TABLE brand_projects (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  competitors TEXT[] NOT NULL,
  tracked_queries TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`analysis_runs`**
```sql
CREATE TABLE analysis_runs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES brand_projects(id) ON DELETE CASCADE,
  run_at TIMESTAMP DEFAULT NOW(),
  queries_generated INTEGER NOT NULL
);
```

**`query_results`**
```sql
CREATE TABLE query_results (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  brand TEXT,
  position INTEGER,
  sentiment TEXT,
  context TEXT,
  response_text TEXT,
  citations JSONB,
  used_web_search BOOLEAN DEFAULT false
);
```

**`project_snapshots`**
```sql
CREATE TABLE project_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES brand_projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMP DEFAULT NOW(),
  total_queries INTEGER,
  brand_mentions INTEGER,
  queries_with_mentions INTEGER,
  share_of_voice JSONB,
  sentiment_breakdown JSONB
);
```

**`user_plans`**
```sql
CREATE TABLE user_plans (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  renews_at TIMESTAMP
);
```

---

## Configuration

### Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `PORT` - Server port (default: 4000)
- `OPENAI_MODEL` - Model name (default: 'gpt-4o-mini')
- `USE_WEB_SEARCH` - Enable web search (default: false)
- `WEB_SEARCH_MODE` - 'responses' or 'chat_completions' (default: 'responses')
- `STRIPE_SECRET_KEY` - Stripe secret key (optional)
- `FRONTEND_ORIGIN` - CORS origin (default: 'http://localhost:5173')

---

## Examples

### Complete Project Workflow

```bash
# 1. Create project
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Stripe",
    "keywords": ["payment processor", "SaaS"],
    "competitors": ["PayPal", "Square"],
    "queries": ["Best payment processor?"]
  }'

# Response: { "project": { "id": "abc123", ... } }

# 2. Run analysis
curl -X POST http://localhost:4000/api/projects/abc123/analyze \
  -H "Authorization: Bearer $TOKEN"

# 3. Get suggestions
curl http://localhost:4000/api/projects/abc123/query-suggestions \
  -H "Authorization: Bearer $TOKEN"

# 4. Track suggested queries
curl -X POST http://localhost:4000/api/projects/abc123/tracked-queries/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queries": ["Stripe vs PayPal", "Best payment gateway for startups"]}'

# 5. Run another analysis
curl -X POST http://localhost:4000/api/projects/abc123/analyze \
  -H "Authorization: Bearer $TOKEN"

# 6. View trends for specific query
curl "http://localhost:4000/api/projects/abc123/query-trends/Best%20payment%20processor%3F" \
  -H "Authorization: Bearer $TOKEN"
```

---

## File Locations

- **Routes:** `backend/src/routes/`
- **Services:** `backend/src/services/`
- **Types:** `backend/src/types.ts`
- **Config:** `backend/src/config/env.ts`
- **Middleware:** `backend/src/middleware/auth.ts`
- **Main:** `backend/src/index.ts`

---

**For more information, see:**
- [Template Contexts Documentation](./TEMPLATE_CONTEXTS.md)
- [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md)
- [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md)
