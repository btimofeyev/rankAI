# RankAI Template Contexts Documentation

## Overview

This document provides comprehensive documentation of all template contexts used throughout the rankAI application. A "template context" refers to any data structure, variable set, or configuration that is passed to templates, components, functions, or API endpoints.

**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [GPT/AI Prompt Templates](#gptai-prompt-templates)
3. [API Endpoint Templates](#api-endpoint-templates)
4. [React Component Templates](#react-component-templates)
5. [Data Flow Overview](#data-flow-overview)
6. [Environment Configuration](#environment-configuration)

---

## Application Architecture

RankAI is an AI brand visibility tracking platform that monitors how brands appear in AI-generated responses compared to competitors.

### Technology Stack

**Backend:**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL) for data persistence
- OpenAI GPT-4o-mini for AI queries
- Stripe for billing

**Frontend:**
- React 18 + TypeScript
- React Router for routing
- TanStack Query (React Query) for data fetching
- Recharts for data visualization
- Vite for bundling

### Key Concepts

- **Project**: A brand tracking configuration with tracked queries
- **Analysis Run**: Execution of tracked queries to check brand visibility
- **Query Result**: Single query execution with brand mentions and citations
- **Snapshot**: Historical data point for trend tracking
- **Query Suggestion**: AI-generated or data-driven query recommendation

---

## GPT/AI Prompt Templates

### 1. AI Query Suggestions Prompt

**Location:** `backend/src/services/querySuggestions.ts:generateAIQuerySuggestions()`

**Purpose:** Generate diverse search queries that cause AI models to compare and recommend multiple brands.

#### Template

```javascript
`You are an AI brand visibility analyst. Generate 10 diverse search queries that would cause AI models (like ChatGPT, Claude, Perplexity) to compare and recommend multiple brands in the "${keywordStr}" space.

Context:
- Brand to track: ${brandName}
- Competitors: ${competitorStr}
- Industry keywords: ${keywordStr}

CRITICAL: These queries will be used to track how often ${brandName} appears in AI-generated recommendations compared to competitors. Generate queries where AI models would naturally mention multiple brands.

Query Types to Generate:
1. Recommendation queries (e.g., "What's the best payment processor for SaaS startups?")
2. Comparison queries (e.g., "Top payment gateways for e-commerce in 2025")
3. Brand vs Brand (e.g., "${brandName} vs ${competitors[0] || 'Square'} for small business")
4. Feature-based comparisons (e.g., "Which ${keywordStr} solution has the lowest transaction fees?")
5. Use-case specific (e.g., "Best payment processor for international transactions")
6. Buying decision queries (e.g., "Most reliable ${keywordStr} platform for startups")

AVOID:
- How-to questions (e.g., "How to integrate Stripe")
- Single-brand-specific questions (e.g., "What are Stripe's fees?")
- Technical implementation questions
- Questions that wouldn't trigger brand comparisons

Requirements:
- Each query should be 5-15 words
- Should feel natural, like something a person would ask an AI assistant
- Must trigger AI to compare/recommend multiple brands
- Mix of broad and specific queries
- Include at least 2 "Brand X vs Brand Y" style comparisons

Return ONLY a JSON object with this structure:
{
  "queries": ["query 1", "query 2", ...]
}`
```

#### Context Variables

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `brandName` | string | Project.brandName | `"Stripe"` |
| `keywordStr` | string | `keywords.join(', ')` or fallback `'this space'` | `"payment processor, payment gateway, online payments"` |
| `competitorStr` | string | `competitors.join(', ')` or fallback `'other solutions'` | `"PayPal, Square, Braintree"` |
| `competitors[0]` | string \| undefined | First competitor with fallback `'Square'` | `"PayPal"` |

#### API Configuration

```typescript
{
  model: env.openaiModel,  // Default: 'gpt-4o-mini'
  response_format: { type: 'json_object' },
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.8  // Higher for diversity
}
```

#### Expected Response

```json
{
  "queries": [
    "What's the best payment processor for SaaS startups?",
    "Stripe vs PayPal for small business",
    "Top payment gateways for e-commerce in 2025",
    ...
  ]
}
```

#### Post-Processing

1. Filter out queries matching `excludeQueries` (case-insensitive)
2. Assign descending scores: `55 - (index * 2)` (range: 55-37)
3. Set category: `'related'`
4. Set reason: `"AI-generated suggestion based on your brand and keywords"`

---

### 2. Web Search Query (Responses API)

**Location:** `backend/src/services/webSearch.ts:queryWithWebSearch()`

**Purpose:** Get AI-generated response with real-time web search citations.

#### Template

```typescript
{
  model: env.openaiModel,
  tools: [{ type: 'web_search' }],
  input: query,  // Direct query, no template
  include: ['web_search_call.action.sources']
}
```

#### Context Variables

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `query` | string | User-tracked query | `"What are the best payment processors for SaaS?"` |

#### API Details

- **Endpoint:** `https://api.openai.com/v1/responses`
- **Method:** POST
- **Response:** Contains `output` array with `web_search_call` and `message` items

#### Response Processing

```typescript
// Extract response text from message content
const messageOutput = response.output.find(item => item.type === 'message');
const responseText = messageOutput.content[0].text;

// Extract citations from annotations
const citations = contentItem.annotations.map(annotation => ({
  url: annotation.url,
  title: annotation.title || '',
  domain: new URL(annotation.url).hostname,
  snippet: responseText.slice(annotation.start_index, annotation.end_index)
}));
```

#### Return Type

```typescript
{
  responseText: string,
  citations: Citation[],
  usedWebSearch: true
}
```

---

### 3. Standard Query (Without Web Search)

**Location:** `backend/src/services/webSearch.ts:queryWithoutWebSearch()`

**Purpose:** Get AI response without web search (fallback mode).

#### Template

```typescript
{
  model: env.openaiModel,
  messages: [
    { role: 'user', content: query }
  ]
}
```

#### Context Variables

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `query` | string | User-tracked query | `"Best payment gateways 2025"` |

#### Return Type

```typescript
{
  responseText: string,
  citations: [],
  usedWebSearch: false
}
```

---

### 4. Brand Mention Analysis

**Location:** `backend/src/services/gptQuery.ts:analyzeResponseForMentions()`

**Purpose:** Extract brand mentions, positions, sentiment, and context from AI responses.

#### Algorithm Context

**Not a GPT prompt** - Uses regex and keyword-based analysis.

#### Context Variables

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `query` | string | Analyzed query | `"Best payment processors"` |
| `responseText` | string | AI response from web search | `"Stripe is the best option..."` |
| `brands` | string[] | `[brandName, ...competitors]` | `["Stripe", "PayPal", "Square"]` |

#### Processing Logic

1. **Brand Detection:**
   ```typescript
   const regex = new RegExp(`\\b${escapedBrand}\\b`, 'gi');
   const matches = [...responseText.matchAll(regex)];
   ```

2. **Position Assignment:** Based on first appearance order (1, 2, 3, ...)

3. **Context Extraction:** 50 chars before and after mention
   ```typescript
   const contextStart = Math.max(0, firstIndex - 50);
   const contextEnd = Math.min(responseText.length, firstIndex + brand.length + 50);
   ```

4. **Sentiment Detection:** Keyword matching in 100-char window
   ```typescript
   const sentimentKeywords = {
     positive: ['best', 'top', 'great', 'excellent', 'leading', 'popular', 'recommended'],
     negative: ['worst', 'poor', 'avoid', 'limited', 'lacking']
   };
   // Default: 'neutral'
   ```

#### Return Type

```typescript
VisibilityMention[] = [
  {
    query: string,
    brand: string,
    position: number,  // 1-based
    sentiment: 'positive' | 'neutral' | 'negative',
    context: string  // 50 chars before/after
  }
]
```

---

### 5. Keyword-Based Fallback Templates

**Location:** `backend/src/services/querySuggestions.ts:generateKeywordSuggestions()`

**Purpose:** Generate queries when OpenAI is unavailable.

#### Templates

```typescript
const templates = [
  `What are the best ${keywordStr} solutions?`,
  `Which ${keywordStr} tool should I choose?`,
  `How do I compare ${keywordStr} platforms?`,
  `What's the difference between ${keywordStr} providers?`,
  `Which ${keywordStr} service is most cost-effective?`
];
```

#### Context Variables

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `keywordStr` | string | `keywords.slice(0, 3).join(', ')` | `"payment, gateway, processor"` |

#### Scoring

```typescript
score: 50 - (index * 5)  // Range: 50, 45, 40, 35, 30
```

---

## API Endpoint Templates

### Authentication Context

**All protected endpoints require:**

```typescript
Headers: {
  'Authorization': 'Bearer <supabase_jwt_token>'
}
```

**Extracted via middleware:** `backend/src/middleware/auth.ts`

```typescript
req.user = {
  id: string,      // User ID from JWT
  email: string    // User email
}
```

---

### Project Endpoints

#### POST `/api/projects`

**Purpose:** Create new brand tracking project

**Request Context:**

```typescript
{
  brandName: string,        // Required, 1-100 chars
  keywords: string[],       // Required, 1-20 items
  competitors: string[],    // Required, 0-5 items (free) or 0-20 (pro)
  queries: string[]         // Required, 1-20 items
}
```

**Response Context:**

```typescript
{
  project: {
    id: string,
    userId: string,
    brandName: string,
    keywords: string[],
    competitors: string[],
    trackedQueries: string[],
    createdAt: string,      // ISO timestamp
    updatedAt: string
  }
}
```

**Validation Rules:**
- Free tier: max 1 competitor
- Pro tier: max 20 competitors
- All tiers: 1-20 tracked queries

---

#### GET `/api/projects/:projectId`

**Purpose:** Get project details with latest dashboard data

**URL Parameters:**

```typescript
{ projectId: string }  // UUID
```

**Response Context:**

```typescript
{
  project: Project,
  runs: AnalysisRun[],
  dashboard: DashboardCards | null,
  totalQueries: number
}
```

**DashboardCards Structure:**

```typescript
{
  summaryCard: {
    brandMentions: number,
    totalQueries: number,
    queriesWithMentions: number,
    shareOfVoice: Record<string, number>  // { "BrandName": 45.5, ... }
  },
  trendCard: {
    series: Array<{
      week: string,        // "Mon DD"
      value: number,       // Total mentions
      [brandName]: number  // Dynamic brand key
    }>,
    delta: number          // Change from previous period
  },
  gapCard: Array<{
    query: string,
    dominatingCompetitor: string,
    recommendation: string,
    gapType?: 'missing' | 'outranked'
  }>,
  actionCard: string[],    // Strategic recommendations
  sentimentCard: {
    positive: number,
    neutral: number,
    negative: number
  }
}
```

---

#### POST `/api/projects/:projectId/analyze`

**Purpose:** Run new analysis on project's tracked queries

**URL Parameters:**

```typescript
{ projectId: string }
```

**Response Context:**

```typescript
{
  run: {
    id: string,
    projectId: string,
    runAt: string,         // ISO timestamp
    queriesGenerated: number
  },
  dashboard: DashboardCards,
  totalQueries: number     // Cumulative across all runs
}
```

**Processing Flow:**
1. Validates plan limits (free: 30-day cooldown)
2. Runs `runBrandVisibilityAnalysis()` on all tracked queries
3. Saves results to `query_results` table
4. Creates snapshot for trend tracking
5. Builds dashboard from all historical data

---

#### GET `/api/projects/:projectId/query-performance`

**Purpose:** Get detailed metrics for each tracked query

**Response Context:**

```typescript
{
  performance: Array<{
    query: string,
    totalAppearances: number,      // Total times brand mentioned
    brandAppearances: number,      // Unique runs with brand mention
    appearanceRate: number,        // Percentage (0-100)
    avgPosition: number,           // Average mention position
    bestPosition: number,          // Best position achieved
    worstPosition: number,         // Worst position
    sentiment: {
      positive: number,
      neutral: number,
      negative: number
    },
    competitorData: Record<string, {
      appearances: number,
      avgPosition: number,
      trendData: number[]          // Last 10 runs (1=appeared, 0=absent)
    }>,
    isTracked: boolean,            // Currently tracked?
    citations: Citation[],         // Latest citations
    usedWebSearch: boolean,        // Latest run used web search?
    trendData: number[]            // Last 10 runs for brand
  }>
}
```

---

#### GET `/api/projects/:projectId/query-suggestions`

**Purpose:** Get AI-powered and data-driven query suggestions

**Response Context:**

```typescript
{
  suggestions: Array<{
    query: string,
    score: number,         // 0-100 (higher = more important)
    reason: string,        // Explanation
    category: 'zero_visibility' | 'competitor_gap' | 'high_performer' | 'related',
    metadata: {
      competitorMentions?: number,
      competitorName?: string,
      brandMissing: boolean,
      avgPosition?: number,
      appearanceRate?: number
    }
  }>
}
```

**Scoring Ranges:**
- **90-100:** Zero visibility queries (critical gaps)
- **60-80:** Competitor gap queries
- **40-60:** High potential queries (strong performers)
- **37-55:** AI-generated suggestions
- **25-50:** Keyword-based fallback suggestions

**Categories:**
- `zero_visibility`: Queries where brand has 0% appearance
- `competitor_gap`: Queries where competitors dominate
- `high_performer`: Queries with >60% appearance, position ≤3
- `related`: AI-generated or keyword-based suggestions

---

#### GET `/api/projects/:projectId/query-trends/:queryText`

**Purpose:** Get detailed trend analysis for specific query

**URL Parameters:**

```typescript
{
  projectId: string,
  queryText: string      // URL-encoded query
}
```

**Response Context:**

```typescript
{
  trends: {
    query: string,
    dataPoints: Array<{
      date: string,        // ISO timestamp
      runId: string,
      appeared: boolean,   // Brand mentioned?
      position: number | null,
      sentiment: 'positive' | 'neutral' | 'negative' | null,
      context: string | null,
      competitorPositions: Record<string, number | null>
    }>,
    overallStats: {
      totalRuns: number,
      appearanceCount: number,
      appearanceRate: number,      // Percentage
      avgPosition: number,
      bestPosition: number,
      worstPosition: number,
      trendDirection: 'up' | 'down' | 'stable',
      sentimentBreakdown: {
        positive: number,
        neutral: number,
        negative: number
      }
    },
    competitorComparison: Record<string, {
      appearanceCount: number,
      avgPosition: number
    }>
  }
}
```

**Trend Direction Calculation:**
- Compare first half vs second half of data
- `diff > 0.1` → `"up"`
- `diff < -0.1` → `"down"`
- Otherwise → `"stable"`

---

#### POST `/api/projects/:projectId/tracked-queries`

**Purpose:** Add single query to tracking

**Request Context:**

```typescript
{ query: string }  // Query to track
```

**Response Context:**

```typescript
{ project: Project }  // Updated project with new query
```

**Validation:**
- Max 20 tracked queries
- No duplicates (case-insensitive)

---

#### POST `/api/projects/:projectId/tracked-queries/bulk`

**Purpose:** Add multiple queries at once

**Request Context:**

```typescript
{ queries: string[] }  // Up to 10 queries
```

**Response Context:**

```typescript
{
  project: Project,
  added: number        // Number successfully added
}
```

**Validation:**
- Combined total ≤ 20 queries
- Skips duplicates

---

#### DELETE `/api/projects/:projectId/tracked-queries`

**Purpose:** Remove query from tracking

**Request Context:**

```typescript
{ query: string }
```

**Response Context:**

```typescript
{ project: Project }
```

---

### Billing Endpoints

#### GET `/api/billing/plan`

**Response Context:**

```typescript
{
  tier: 'free' | 'pro',
  renewsAt?: string    // ISO timestamp (pro only)
}
```

---

#### POST `/api/billing/checkout`

**Request Context:**

```typescript
{
  successPath?: string,  // Default: '/dashboard?billing=success'
  cancelPath?: string    // Default: '/dashboard?billing=cancelled'
}
```

**Response Context:**

```typescript
{ url: string }  // Stripe checkout URL
```

---

## React Component Templates

### Context Providers

#### SessionProvider Context

**Location:** `frontend/src/hooks/useSession.tsx`

**Context Type:**

```typescript
{
  session: Session | null,     // Supabase session
  loading: boolean,
  plan: 'free' | 'pro',
  setPlan: (plan: 'free' | 'pro') => void,
  signOut: () => Promise<void>
}
```

**Usage:**
```typescript
const { session, plan } = useSession();
```

---

### Page Components

#### ProjectDashboardPage

**Location:** `frontend/src/pages/ProjectDashboardPage.tsx`

**Data Dependencies:**

```typescript
// React Query keys
['project', projectId]              // Project details
['query-performance', projectId]    // Performance metrics
['query-suggestions', projectId]    // AI suggestions
```

**Computed State:**

```typescript
{
  avgAppearanceRate: number,  // Average across all queries
  avgPosition: number         // Average position when mentioned
}
```

**Child Component Props:**

1. **QueryPerformanceCardNew:**
   ```typescript
   {
     performance: QueryPerformance,
     brandName: string,
     competitors: string[],
     onRemove: (query: string) => void,
     canRemove: boolean,
     onViewDetails: (query: string) => void
   }
   ```

2. **QuerySuggestionsCard:**
   ```typescript
   {
     suggestions: QuerySuggestion[],
     onTrack: (query: string) => void,
     onBulkTrack: (queries: string[]) => void,
     loading: boolean,
     trackedCount: number
   }
   ```

3. **OverallStatsCard:**
   ```typescript
   {
     performance: QueryPerformance[],
     maxQueries: number  // 20
   }
   ```

---

### Data Visualization Components

#### QueryTrendChart

**Location:** `frontend/src/components/QueryTrendChart.tsx`

**Props Context:**

```typescript
{
  dataPoints: Array<{
    date: string,
    runId: string,
    appeared: boolean,
    position: number | null,
    sentiment: string | null,
    context: string | null,
    competitorPositions: Record<string, number | null>
  }>,
  brandName: string,
  competitors: string[]
}
```

**Chart Configuration:**
- Uses Recharts LineChart
- Y-axis reversed (lower position = better)
- Multi-line: brand + each competitor
- Color coding: Brand (primary), Competitors (secondary colors)

---

#### MiniSparkline

**Location:** `frontend/src/components/MiniSparkline.tsx`

**Props Context:**

```typescript
{
  data: number[],          // Array of 0s and 1s typically
  width?: number,          // Default: 60
  height?: number,         // Default: 20
  color?: string,          // Default: 'var(--accent)'
  strokeWidth?: number     // Default: 2
}
```

**Usage Example:**
```typescript
<MiniSparkline
  data={[0, 1, 1, 0, 1, 1, 1, 0, 1, 1]}
  width={80}
  height={24}
/>
```

---

### Modal Components

#### QueryDetailModal

**Location:** `frontend/src/components/QueryDetailModal.tsx`

**Props Context:**

```typescript
{
  projectId: string,
  queryText: string,
  brandName: string,
  competitors: string[],
  onClose: () => void
}
```

**Internal Data Fetching:**

```typescript
// Fetches on mount
fetchQueryTrends(token, projectId, queryText)
  → QueryTrendsResponse
```

**Modal Structure:**
1. Header with close button
2. Overall stats grid (4 metrics)
3. Trend chart (QueryTrendChart)
4. Competitor comparison table

---

#### BulkTrackModal

**Location:** `frontend/src/components/BulkTrackModal.tsx`

**Props Context:**

```typescript
{
  suggestions: QuerySuggestion[],
  trackedCount: number,      // Current tracked queries count
  onTrack: (queries: string[]) => void,
  onClose: () => void
}
```

**Internal State:**

```typescript
{
  selectedQueries: Set<string>,
  maxQueries: 20,
  remainingSlots: number     // Computed: maxQueries - trackedCount
}
```

**Category Groups:**

```typescript
{
  zero_visibility: { icon: '🎯', label: 'Critical Gaps' },
  competitor_gap: { icon: '⚔️', label: 'Competitive Gaps' },
  high_performer: { icon: '⭐', label: 'High Performers' },
  related: { icon: '💡', label: 'Related Queries' }
}
```

---

### Card Components

#### QueryPerformanceCardNew

**Location:** `frontend/src/components/QueryPerformanceCardNew.tsx`

**Props Context:**

```typescript
{
  performance: QueryPerformance,
  brandName: string,
  competitors: string[],
  onRemove?: (query: string) => void,
  canRemove?: boolean,
  onViewDetails?: (query: string) => void
}
```

**Status Badge Logic:**

```typescript
// Computed status
if (!hasData) {
  badge = null;
} else if (!hasBrandData && hasCompetitorData) {
  badge = { text: "Competitors dominate", variant: "danger" };
} else if (!hasBrandData) {
  badge = { text: "No visibility yet", variant: "warning" };
} else if (avgPosition <= 1) {
  badge = { text: "You own this query", variant: "success" };
} else if (avgPosition > 3) {
  badge = { text: "Improve positioning", variant: "warning" };
}
```

**Sentiment Chips:**

```typescript
{
  positive: { emoji: '😊', color: 'green' },
  neutral: { emoji: '😐', color: 'gray' },
  negative: { emoji: '😟', color: 'red' }
}
```

---

#### CitationsDisplay

**Location:** `frontend/src/components/CitationsDisplay.tsx`

**Props Context:**

```typescript
{
  citations: Array<{
    url: string,
    title: string,
    domain: string,
    snippet?: string
  }>,
  compact?: boolean  // Default: false
}
```

**Rendering Modes:**

1. **Compact Mode:**
   - Badge with count: `🌐 3 sources`
   - First 3 domain names

2. **Full Mode:**
   - Citation cards with full details
   - Clickable title (opens in new tab)
   - Domain badge
   - Snippet text

---

## Data Flow Overview

### Analysis Run Flow

```
User clicks "Run Analysis"
  ↓
POST /api/projects/:projectId/analyze
  ↓
runBrandVisibilityAnalysis(brand, keywords, competitors, trackedQueries)
  ↓
For each tracked query (batches of 5):
  ├─→ queryWithWebSearch(query) OR queryWithoutWebSearch(query)
  │     ↓
  │   OpenAI API (Responses or Chat Completions)
  │     ↓
  │   Returns: { responseText, citations, usedWebSearch }
  │     ↓
  └─→ analyzeResponseForMentions(query, responseText, brands)
        ↓
      Extracts: { brand, position, sentiment, context }
  ↓
repository.saveQueryResults(runId, results)
repository.createSnapshot(projectId, runId, aggregatedData)
  ↓
buildDashboardSummary(brand, competitors, allResults, snapshots)
  ↓
Returns: { run, dashboard, totalQueries }
  ↓
Frontend invalidates React Query cache
  ↓
UI updates with new data
```

---

### Query Suggestion Flow

```
User loads project dashboard
  ↓
GET /api/projects/:projectId/query-suggestions
  ↓
generateQuerySuggestions(projectId, brand, competitors, trackedQueries, keywords)
  ↓
Has historical data?
  ├─ YES ─→ analyzeQueries()
  │           ├─→ findZeroVisibilityQueries() [score: 90-100]
  │           ├─→ findCompetitorGaps() [score: 60-80]
  │           └─→ findHighPotentialQueries() [score: 40-60]
  │
  └─ NO/LOW ─→ generateAIQuerySuggestions()
                  ↓
                OpenAI Chat Completions (temp: 0.8)
                  ↓
                Returns 10 AI-generated queries [score: 37-55]
  ↓
Fallback if needed: generateKeywordSuggestions() [score: 25-50]
  ↓
Sort by score DESC, return top 10
  ↓
Frontend displays in QuerySuggestionsCard
  ↓
User tracks queries → POST /api/projects/:projectId/tracked-queries/bulk
```

---

### Dashboard Data Flow

```
ProjectDashboardPage mounts
  ↓
Parallel React Query fetches:
  ├─→ fetchProject(projectId)
  ├─→ fetchQueryPerformance(projectId)
  └─→ fetchQuerySuggestions(projectId)
  ↓
All queries complete
  ↓
Compute derived metrics:
  ├─→ avgAppearanceRate
  └─→ avgPosition
  ↓
Render components with props:
  ├─→ OverallStatsCard (aggregated metrics)
  ├─→ SimplifiedStatsBar (summary + run button)
  ├─→ QueryPerformanceCardNew[] (individual cards)
  └─→ QuerySuggestionsCard (suggestions)
  ↓
User clicks "View details" on query
  ↓
Opens QueryDetailModal
  ↓
Fetches: fetchQueryTrends(projectId, queryText)
  ↓
Displays: QueryTrendChart + stats + competitor comparison
```

---

## Environment Configuration

### Backend Environment Variables

**Location:** `backend/src/config/env.ts`

```typescript
{
  nodeEnv: 'development' | 'production',
  port: number,                          // Default: 4000
  supabaseUrl: string | undefined,
  supabaseServiceRoleKey: string | undefined,
  openaiApiKey: string | undefined,
  openaiModel: string,                   // Default: 'gpt-4o-mini'
  useWebSearch: boolean,                 // Default: false
  webSearchMode: 'responses' | 'chat_completions',  // Default: 'responses'
  stripeSecretKey: string | undefined,
  frontendOrigin: string                 // Default: 'http://localhost:5173'
}
```

**Required Variables:**
- `SUPABASE_URL` - For data persistence
- `SUPABASE_SERVICE_ROLE_KEY` - For database access
- `OPENAI_API_KEY` - For AI queries
- `STRIPE_SECRET_KEY` - For billing (optional, falls back to mock)

**Optional Variables:**
- `OPENAI_MODEL` - Change AI model (default: gpt-4o-mini)
- `USE_WEB_SEARCH` - Enable web search citations
- `WEB_SEARCH_MODE` - Choose API (responses recommended)

---

### Frontend Environment Variables

**Location:** `frontend/.env`

```typescript
{
  VITE_API_URL: string,              // Backend API URL
  VITE_SUPABASE_URL: string,         // Supabase project URL
  VITE_SUPABASE_ANON_KEY: string     // Supabase anonymous key
}
```

---

## Fallback Strategies

### 1. OpenAI Unavailable

**Query Generation:**
```typescript
// Falls back to keyword-based templates
[
  `What are the best ${keywords} solutions?`,
  `Which ${keywords} tool should I choose?`,
  ...
]
```

**Suggestions:**
```typescript
// Falls back to keyword templates with scores 25-50
generateKeywordSuggestions(keywords, brandName)
```

---

### 2. Supabase Unavailable

**All repository methods fall back to in-memory store:**
```typescript
// backend/src/services/repository.ts
if (!supabase) {
  // Use inMemoryDb object
}
```

---

### 3. Stripe Unavailable

**Auto-upgrades to pro in development:**
```typescript
// backend/src/services/billing.ts
if (!env.stripeSecretKey) {
  return { url: '/dashboard?billing=success' };
  // Also auto-sets plan to 'pro'
}
```

---

## Appendix: Type Definitions

### Core Backend Types

**Location:** `backend/src/types.ts`

```typescript
type VisibilityMention = {
  query: string;
  brand: string;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
};

type Citation = {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
};

type QueryResult = {
  id: string;
  runId: string;
  queryText: string;
  brand: string | null;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  context: string | null;
  responseText?: string;
  citations?: Citation[];
  usedWebSearch?: boolean;
};

type BrandProject = {
  id: string;
  userId: string;
  brandName: string;
  keywords: string[];
  competitors: string[];
  trackedQueries: string[];
  createdAt: string;
  updatedAt: string;
};
```

---

### Core Frontend Types

**Location:** `frontend/src/types/api.ts`

```typescript
type QueryPerformance = {
  query: string;
  totalAppearances: number;
  brandAppearances: number;
  appearanceRate: number;
  avgPosition: number;
  bestPosition: number;
  worstPosition: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  competitorData: Record<string, {
    appearances: number;
    avgPosition: number;
    trendData?: number[];
  }>;
  isTracked: boolean;
  citations?: Citation[];
  usedWebSearch?: boolean;
  trendData?: number[];
};

type QuerySuggestion = {
  query: string;
  score: number;
  reason: string;
  category: 'zero_visibility' | 'competitor_gap' | 'high_performer' | 'related';
  metadata: {
    competitorMentions?: number;
    competitorName?: string;
    brandMissing: boolean;
    avgPosition?: number;
    appearanceRate?: number;
  };
};
```

---

## Document History

- **2025-10-13:** Initial comprehensive documentation created
- Document includes all template contexts from backend services, API endpoints, and frontend components
- Based on analysis of rankAI codebase at commit `d3e50e0`

---

**For detailed reference documentation, see:**
- [Backend API Reference](./BACKEND_API_REFERENCE.md)
- [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md)
- [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md)
