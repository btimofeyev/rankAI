# Frontend Components Reference

Complete documentation for all React components in the rankAI frontend application.

**Technology:** React 18 + TypeScript + React Router + TanStack Query

**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Context Providers](#context-providers)
2. [Routing & Pages](#routing--pages)
3. [Layout Components](#layout-components)
4. [UI Components](#ui-components)
5. [Data Visualization](#data-visualization)
6. [Query Management](#query-management)
7. [Modal Components](#modal-components)
8. [Card Components](#card-components)
9. [Hooks](#hooks)
10. [Type Definitions](#type-definitions)

---

## Context Providers

### SessionProvider

**Location:** `frontend/src/hooks/useSession.tsx`

**Purpose:** Manages authentication state, user session, and plan tier across the application.

**Context Type:**

```typescript
type SessionContextValue = {
  session: Session | null;      // Supabase session
  loading: boolean;             // Initial auth check
  plan: 'free' | 'pro';         // User plan tier
  setPlan: (plan: 'free' | 'pro') => void;
  signOut: () => Promise<void>;
};
```

**Usage:**

```typescript
import { useSession } from '@/hooks/useSession';

function MyComponent() {
  const { session, plan, signOut } = useSession();

  if (!session) return <div>Please sign in</div>;

  return (
    <div>
      <p>Plan: {plan}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

**Provider Setup:**

Wrap your app in `main.tsx`:

```typescript
<SessionProvider>
  <App />
</SessionProvider>
```

---

## Routing & Pages

### App (Router Configuration)

**Location:** `frontend/src/App.tsx`

**Routes:**

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | LandingPage | No | Public landing/auth page |
| `/dashboard` | DashboardPage | Yes | Legacy dashboard (deprecated) |
| `/projects` | ProjectsPage | Yes | Projects list and creation |
| `/projects/:projectId` | ProjectDashboardPage | Yes | Project dashboard and analytics |
| `/projects/:projectId/queries` | QueryDetailPage | Yes | Detailed query history |

**Auth Guard:**

```typescript
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/" />;

  return <>{children}</>;
}
```

---

### LandingPage

**Location:** `frontend/src/pages/LandingPage.tsx`

**Purpose:** Public landing page with sign-up/login forms.

**Props:** None (uses context)

**State:**

```typescript
{
  mode: 'sign-up' | 'login',
  email: string,
  password: string,
  loading: boolean,
  error: string
}
```

**Authentication:**

Uses Supabase Auth directly:

```typescript
// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });
```

**Navigation:**

On successful auth, redirects to `/projects`.

---

### ProjectsPage

**Location:** `frontend/src/pages/ProjectsPage.tsx`

**Purpose:** List all projects and create new projects.

**Data Fetching:**

```typescript
// React Query
const projectsQuery = useQuery({
  queryKey: ['projects'],
  queryFn: () => fetchProjects(session!.access_token)
});
```

**State:**

```typescript
{
  showCreateForm: boolean,
  brandName: string,
  keywords: string,          // CSV input
  competitors: string,       // CSV input
  queries: string[],         // Array from QueryBuilder
  error: string
}
```

**Create Project Flow:**

1. User fills form: brand, keywords, competitors, queries
2. Validates inputs (1-20 queries, 0-5 competitors for free tier)
3. Calls `createProject()` mutation
4. On success, navigates to `/projects/:projectId`

**Child Components:**

- **AppShell:** Layout with navigation
- **QueryBuilder:** Manage tracked queries (max 20)
- **Button:** Form actions

**Example:**

```typescript
<QueryBuilder
  queries={queries}
  onQueriesChange={setQueries}
  maxQueries={20}
/>
```

---

### ProjectDashboardPage

**Location:** `frontend/src/pages/ProjectDashboardPage.tsx`

**Purpose:** Main project dashboard with analytics, performance metrics, and query management.

**URL Params:**

```typescript
const { projectId } = useParams<{ projectId: string }>();
```

**Data Fetching:**

```typescript
// Multiple parallel queries
const projectQuery = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => fetchProject(token, projectId)
});

const performanceQuery = useQuery({
  queryKey: ['query-performance', projectId],
  queryFn: () => fetchQueryPerformance(token, projectId)
});

const suggestionsQuery = useQuery({
  queryKey: ['query-suggestions', projectId],
  queryFn: () => fetchQuerySuggestions(token, projectId)
});
```

**Mutations:**

```typescript
// Run analysis
runAnalysisMutation.mutate(undefined, {
  onSuccess: () => {
    queryClient.invalidateQueries(['project', projectId]);
    queryClient.invalidateQueries(['query-performance', projectId]);
  }
});

// Track query
trackQueryMutation.mutate(query);

// Untrack query
untrackQueryMutation.mutate(query);

// Bulk track
bulkTrackMutation.mutate(['query1', 'query2']);

// Update config
updateProjectMutation.mutate({ keywords, competitors });

// Delete project
deleteProjectMutation.mutate();
```

**State:**

```typescript
{
  editMode: boolean,
  keywords: string[],
  competitors: string[],
  configError: string,
  analysisError: string,
  selectedQuery: string | null
}
```

**Layout:**

```
┌─────────────────────────────────────────────┐
│ AppShell (Navigation + Plan Badge)         │
├─────────────────────────┬───────────────────┤
│ Config Sidebar          │ Main Content      │
│ - Brand Name            │ - Stats Bar       │
│ - Keywords (editable)   │ - Overall Stats   │
│ - Competitors (editable)│ - Suggestions     │
│ - Save/Cancel buttons   │ - Performance Cards│
│ - Run Analysis button   │                   │
│ - Delete Project button │                   │
└─────────────────────────┴───────────────────┘
```

**Child Components:**

- **AppShell:** Layout
- **SimplifiedStatsBar:** Summary metrics + run button
- **OverallStatsCard:** Aggregated statistics
- **QuerySuggestionsCard:** AI-powered suggestions
- **QueryPerformanceCardNew:** Individual query metrics
- **QueryDetailModal:** Trend analysis (conditional)

**Computed Metrics:**

```typescript
const avgAppearanceRate = Math.round(
  performance.reduce((sum, p) => sum + p.appearanceRate, 0) / performance.length
);

const avgPosition = (
  performance.reduce((sum, p) => sum + (p.avgPosition || 0), 0) /
  performance.filter(p => p.avgPosition > 0).length
).toFixed(1);
```

---

### QueryDetailPage

**Location:** `frontend/src/pages/QueryDetailPage.tsx`

**Purpose:** Detailed query history with filtering and citation display.

**URL Params:**

```typescript
const { projectId } = useParams<{ projectId: string }>();
```

**Data Fetching:**

```typescript
const queriesQuery = useQuery({
  queryKey: ['project-queries', projectId],
  queryFn: () => fetchProjectQueries(token, projectId)
});
```

**State:**

```typescript
{
  searchTerm: string,
  brandFilter: string,          // '' = all, 'none' = no mentions, or brand name
  sentimentFilter: string,      // '' = all, or sentiment
  expandedRow: string | null    // Query ID
}
```

**Filtering:**

```typescript
const filteredQueries = queries.filter(q => {
  const matchesSearch = q.queryText.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesBrand = brandFilter === '' ||
    (brandFilter === 'none' ? !q.brand : q.brand === brandFilter);

  const matchesSentiment = sentimentFilter === '' ||
    q.sentiment === sentimentFilter;

  return matchesSearch && matchesBrand && matchesSentiment;
});
```

**Grouping:**

Queries are grouped by `queryText` for display.

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Search: [_________]  Brand: [▼]  Sentiment: [▼] │
├─────────────────────────────────────────────┤
│ Query: "Best payment processor?"            │
│ ┌─────────────────────────────────────────┐ │
│ │ Oct 13 | Brand: Stripe | Position: #1   │ │
│ │ Sentiment: 😊 Positive                   │ │
│ │ Citations: [🌐 3 sources]                │ │
│ │ [▼ Expand for details]                   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Oct 06 | Brand: None                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Child Components:**

- **AppShell:** Layout
- **CitationsDisplay:** Show citations in expanded rows

---

### DashboardPage (Legacy)

**Location:** `frontend/src/pages/DashboardPage.tsx`

**Status:** ⚠️ DEPRECATED - Use ProjectDashboardPage instead

**Purpose:** Original single-project dashboard (before multi-project support).

---

## Layout Components

### AppShell

**Location:** `frontend/src/components/AppShell.tsx`

**Purpose:** Main application layout with sidebar navigation, plan badge, and sign-out.

**Props:**

```typescript
type AppShellProps = {
  planTier: 'free' | 'pro';
  navItems: NavItem[];
  topBar?: ReactNode;
  footerNote?: ReactNode;
  onSignOut: () => Promise<void> | void;
  children: ReactNode;
};

type NavItem = {
  label: string;
  to: string;
};
```

**Layout:**

```
┌───────────────┬─────────────────────────────┐
│               │ Top Bar (optional)          │
│  RankAI       ├─────────────────────────────┤
│               │                             │
│  Nav Item 1   │                             │
│  Nav Item 2   │       Main Content          │
│               │       (children)            │
│  Plan Badge   │                             │
│               │                             │
│  Sign Out     │                             │
│               ├─────────────────────────────┤
│               │ Footer Note (optional)      │
└───────────────┴─────────────────────────────┘
```

**Example:**

```typescript
<AppShell
  planTier={plan}
  navItems={[
    { label: 'Projects', to: '/projects' },
    { label: 'Settings', to: '/settings' }
  ]}
  onSignOut={signOut}
>
  <ProjectDashboard />
</AppShell>
```

**Child Components:**

- **PlanBadge:** Display plan tier
- **NavLink:** React Router links (active highlighting)
- **Button:** Sign out action

---

### Layout

**Location:** `frontend/src/components/Layout.tsx`

**Purpose:** Public page layout (landing page).

**Props:**

```typescript
{ children: ReactNode }
```

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Header                                      │
│  RankAI        [Sign In] [Sign Up]         │
├─────────────────────────────────────────────┤
│                                             │
│              Main Content                   │
│              (children)                     │
│                                             │
├─────────────────────────────────────────────┤
│ Footer                                      │
│  © 2025 RankAI                             │
└─────────────────────────────────────────────┘
```

---

## UI Components

### Button

**Location:** `frontend/src/components/Button.tsx`

**Purpose:** Reusable button with variant styles.

**Props:**

```typescript
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger';
};
```

**Variants:**

- **primary:** Blue background, white text (default)
- **ghost:** Transparent background, gray text, border
- **quiet:** Transparent background, no border
- **danger:** Red background, white text

**Example:**

```typescript
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

<Button variant="danger" onClick={handleDelete}>
  Delete Project
</Button>
```

---

### MetricCard

**Location:** `frontend/src/components/MetricCard.tsx`

**Purpose:** Card container for metrics with header.

**Props:**

```typescript
type MetricCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};
```

**Example:**

```typescript
<MetricCard title="Brand Mentions" subtitle="Last 7 days">
  <div className="metric-value">45</div>
</MetricCard>
```

---

### PlanBadge

**Location:** `frontend/src/components/PlanBadge.tsx`

**Purpose:** Display user's plan tier badge.

**Props:**

```typescript
{ tier: 'free' | 'pro' }
```

**Display:**

- **Free:** Gray badge with "Free Plan"
- **Pro:** Purple gradient badge with "Pro Plan"

---

## Data Visualization

### TrendChart

**Location:** `frontend/src/components/TrendChart.tsx`

**Purpose:** SVG line chart with gradient fill for trend visualization.

**Props:**

```typescript
type TrendChartProps = {
  points: TrendPoint[];
};

type TrendPoint = {
  week: string;        // "Mon DD" format
  value: number;
  [brand: string]: string | number;  // Dynamic brand keys
};
```

**Features:**

- Normalizes to max value
- Responsive viewBox (100 x 50)
- Gradient fill below line
- Custom gradient per instance (random ID)

**Example:**

```typescript
<TrendChart
  points={[
    { week: 'Oct 01', value: 10, Stripe: 5, PayPal: 3 },
    { week: 'Oct 08', value: 15, Stripe: 8, PayPal: 5 },
    { week: 'Oct 15', value: 12, Stripe: 6, PayPal: 4 }
  ]}
/>
```

---

### MiniSparkline

**Location:** `frontend/src/components/MiniSparkline.tsx`

**Purpose:** Compact inline sparkline for trend indicators.

**Props:**

```typescript
type MiniSparklineProps = {
  data: number[];
  width?: number;         // Default: 60
  height?: number;        // Default: 20
  color?: string;         // Default: 'var(--accent)'
  strokeWidth?: number;   // Default: 2
};
```

**Example:**

```typescript
<MiniSparkline
  data={[1, 1, 0, 1, 1, 1, 0, 1, 1, 1]}
  width={80}
  height={24}
  color="green"
/>
```

**Use Cases:**

- Trend indicators in CompetitorBadge
- Query performance cards
- Inline metric trends

---

### QueryTrendChart

**Location:** `frontend/src/components/QueryTrendChart.tsx`

**Purpose:** Recharts line chart for brand vs competitor position trends.

**Props:**

```typescript
type QueryTrendChartProps = {
  dataPoints: QueryTrendDataPoint[];
  brandName: string;
  competitors: string[];
};

type QueryTrendDataPoint = {
  date: string;
  runId: string;
  appeared: boolean;
  position: number | null;
  sentiment: string | null;
  context: string | null;
  competitorPositions: Record<string, number | null>;
};
```

**Features:**

- Multi-line chart (brand + competitors)
- Reversed Y-axis (position 1 at top)
- Color-coded lines (brand = primary, competitors = secondary)
- Tooltips with date and positions
- Legend

**Example:**

```typescript
<QueryTrendChart
  dataPoints={[
    {
      date: '2025-10-01T12:00:00Z',
      appeared: true,
      position: 1,
      competitorPositions: { PayPal: 2, Square: null }
    },
    {
      date: '2025-10-08T12:00:00Z',
      appeared: true,
      position: 2,
      competitorPositions: { PayPal: 1, Square: 3 }
    }
  ]}
  brandName="Stripe"
  competitors={['PayPal', 'Square']}
/>
```

---

### ComparisonChart

**Location:** `frontend/src/components/ComparisonChart.tsx`

**Purpose:** Recharts line chart for multi-brand comparison.

**Props:**

```typescript
{
  data: TrendPoint[];
  brands: string[];
}
```

---

### SentimentChart

**Location:** `frontend/src/components/SentimentChart.tsx`

**Purpose:** Recharts pie chart for sentiment breakdown.

**Props:**

```typescript
{
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }
}
```

**Colors:**

- Positive: Green
- Neutral: Gray
- Negative: Red

---

### ShareOfVoiceList

**Location:** `frontend/src/components/ShareOfVoiceList.tsx`

**Purpose:** Horizontal bar chart for brand share of voice.

**Props:**

```typescript
{ share: ShareOfVoice }  // Record<string, number>
```

**Example:**

```typescript
<ShareOfVoiceList
  share={{
    'Stripe': 45.5,
    'PayPal': 30.2,
    'Square': 24.3
  }}
/>
```

**Display:**

```
Stripe    ████████████████████████ 45.5%
PayPal    ████████████████         30.2%
Square    ████████████             24.3%
```

---

### GapList

**Location:** `frontend/src/components/GapList.tsx`

**Purpose:** Display top competitive gap opportunities.

**Props:**

```typescript
{ gaps: GapOpportunity[] }

type GapOpportunity = {
  query: string;
  dominatingCompetitor: string;
  recommendation: string;
  gapType?: 'missing' | 'outranked';
};
```

**Display:**

Shows top 3 gaps with query, competitor, and recommendation.

---

### ActionList

**Location:** `frontend/src/components/ActionList.tsx`

**Purpose:** Display strategic action recommendations.

**Props:**

```typescript
{ actions: string[] }
```

**Display:**

Shows top 4 actions as a bullet list.

---

## Query Management

### QueryBuilder

**Location:** `frontend/src/components/QueryBuilder.tsx`

**Purpose:** Input interface for managing tracked queries with suggestion support.

**Props:**

```typescript
type QueryBuilderProps = {
  queries: string[];
  onQueriesChange: (queries: string[]) => void;
  suggestions?: QuerySuggestion[];
  onLoadSuggestions?: () => void;
  loadingSuggestions?: boolean;
  maxQueries?: number;  // Default: 20
};
```

**Features:**

- Add query via input + button (or Enter key)
- Remove individual queries with × button
- Display suggestions by category
- Validation (max queries, duplicates)
- Character counter

**Example:**

```typescript
<QueryBuilder
  queries={queries}
  onQueriesChange={setQueries}
  maxQueries={20}
  suggestions={suggestions}
  onLoadSuggestions={loadSuggestions}
/>
```

**UI:**

```
┌─────────────────────────────────────────┐
│ [Enter query...               ] [Add]  │
├─────────────────────────────────────────┤
│ ✓ Best payment processor?          [×] │
│ ✓ Stripe vs PayPal comparison      [×] │
│                                         │
│ 2 / 20 queries tracked                 │
└─────────────────────────────────────────┘
```

---

### QuerySuggestionsCard

**Location:** `frontend/src/components/QuerySuggestionsCard.tsx`

**Purpose:** Display AI-generated query suggestions with bulk tracking.

**Props:**

```typescript
type QuerySuggestionsCardProps = {
  suggestions: QuerySuggestion[];
  onTrack: (query: string) => void;
  onBulkTrack: (queries: string[]) => void;
  loading?: boolean;
  trackedCount: number;
};
```

**Features:**

- Category-based display with icons
- Individual track buttons
- "Track multiple" button (opens BulkTrackModal)
- Collapsible (show 3 or expand to 5)
- Track limit warning (8+/20)

**Category Icons:**

- 🎯 **zero_visibility:** Critical gaps
- ⚔️ **competitor_gap:** Competitive gaps
- ⭐ **high_performer:** High performers
- 💡 **related:** Related queries

**Example:**

```typescript
<QuerySuggestionsCard
  suggestions={suggestions}
  onTrack={trackQuery}
  onBulkTrack={bulkTrack}
  loading={loading}
  trackedCount={queries.length}
/>
```

**UI:**

```
┌─────────────────────────────────────────┐
│ Query Suggestions          [Track Multiple]│
├─────────────────────────────────────────┤
│ 🎯 Best payment processor for intl?      │
│    Critical gap - PayPal appears  [Track]│
│                                          │
│ ⚔️ Stripe vs PayPal for e-commerce       │
│    PayPal appears 80% vs your 40% [Track]│
│                                          │
│                        [Show more (5)]   │
└─────────────────────────────────────────┘
```

---

### TopQueriesCard

**Location:** `frontend/src/components/TopQueriesCard.tsx`

**Purpose:** Show top performing queries with track/untrack actions.

**Props:**

```typescript
type TopQueriesCardProps = {
  performance: QueryPerformance[];
  onTrack: (query: string) => void;
  onUntrack: (query: string) => void;
  loading?: boolean;
};
```

**Features:**

- Shows top 5 queries by appearance rate
- Pin icon for tracked queries
- Citations display (compact)
- Web search badge
- Metrics: mentions, appearance rate, avg position

---

## Modal Components

### QueryDetailModal

**Location:** `frontend/src/components/QueryDetailModal.tsx`

**Purpose:** Modal for detailed trend analysis of a specific query.

**Props:**

```typescript
type QueryDetailModalProps = {
  projectId: string;
  queryText: string;
  brandName: string;
  competitors: string[];
  onClose: () => void;
};
```

**Data Fetching:**

Fetches trends on mount:

```typescript
const trendsQuery = useQuery({
  queryKey: ['query-trends', projectId, queryText],
  queryFn: () => fetchQueryTrends(token, projectId, queryText)
});
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ Query: "Best payment processor?"    [×] │
├─────────────────────────────────────────┤
│ Overall Stats                           │
│ ┌────────┬────────┬────────┬─────────┐ │
│ │ 80%    │ #1.5   │ Up ↗   │ 😊 75%  │ │
│ │ Appear │ Avg    │ Trend  │ Positive│ │
│ └────────┴────────┴────────┴─────────┘ │
├─────────────────────────────────────────┤
│ Trend Over Time                         │
│ [QueryTrendChart]                       │
├─────────────────────────────────────────┤
│ Competitor Comparison                   │
│ PayPal:  70% appearance, avg #2.1       │
│ Square:  40% appearance, avg #3.5       │
└─────────────────────────────────────────┘
```

**Child Components:**

- **QueryTrendChart:** Position trends over time

**Keyboard Support:**

- Escape key closes modal

---

### BulkTrackModal

**Location:** `frontend/src/components/BulkTrackModal.tsx`

**Purpose:** Modal for selecting multiple queries to track at once.

**Props:**

```typescript
type BulkTrackModalProps = {
  suggestions: QuerySuggestion[];
  trackedCount: number;
  onTrack: (queries: string[]) => void;
  onClose: () => void;
};
```

**Features:**

- Group by category
- Checkbox selection
- Quick actions: Select All, Clear All, Select by Category
- Shows remaining slots (10 - trackedCount)
- Validates max selection

**State:**

```typescript
{
  selectedQueries: Set<string>,
  maxQueries: 20,
  remainingSlots: number
}
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ Track Multiple Queries              [×] │
│ Selected: 3   Remaining slots: 7        │
│                                         │
│ [Select All] [Clear All]                │
├─────────────────────────────────────────┤
│ 🎯 Critical Gaps         [Select All]   │
│ □ Best payment for intl transactions    │
│ ✓ Top payment gateways 2025             │
│                                         │
│ ⚔️ Competitive Gaps      [Select All]   │
│ ✓ Stripe vs PayPal for e-commerce       │
│ □ Best payment processor for startups   │
├─────────────────────────────────────────┤
│                   [Cancel] [Track (3)]  │
└─────────────────────────────────────────┘
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

## Card Components

### QueryPerformanceCard (Legacy)

**Location:** `frontend/src/components/QueryPerformanceCard.tsx`

**Status:** ⚠️ Superseded by QueryPerformanceCardNew

**Props:**

```typescript
type QueryPerformanceCardProps = {
  performance: QueryPerformance;
  onRemove?: (query: string) => void;
  canRemove?: boolean;
  onViewDetails?: (query: string) => void;
};
```

---

### QueryPerformanceCardNew

**Location:** `frontend/src/components/QueryPerformanceCardNew.tsx`

**Purpose:** Enhanced query performance card with status badges and trend sparkline.

**Props:**

```typescript
type QueryPerformanceCardNewProps = {
  performance: QueryPerformance;
  brandName: string;
  competitors: string[];
  onRemove?: (query: string) => void;
  canRemove?: boolean;
  onViewDetails?: (query: string) => void;
};
```

**Status Badge Logic:**

```typescript
if (!hasData) {
  badge = null;  // Not analyzed yet
} else if (!hasBrandData && hasCompetitorData) {
  badge = { text: "Competitors dominate", variant: "danger" };
} else if (!hasBrandData) {
  badge = { text: "No visibility yet", variant: "warning" };
} else if (avgPosition <= 1) {
  badge = { text: "You own this query", variant: "success" };
} else if (avgPosition > 3) {
  badge = { text: "Improve positioning", variant: "warning" };
} else {
  badge = null;  // Good positioning (1-3)
}
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ Best payment processor for SaaS?    [×] │
│ [You own this query ✓]                  │
├─────────────────────────────────────────┤
│ Appearance Rate: 87.5% (7/8 runs)       │
│ Avg Position: #1.5  Best: #1  Worst: #3│
│ Mentions: 8                             │
│                                         │
│ Trend: ██▁██████  +15%                  │
│                                         │
│ Sentiment: 😊 6  😐 1  😟 0              │
│                                         │
│ Leading Competitor: PayPal (#2.5)       │
│                                         │
│ Citations: 🌐 3 sources                 │
│                                         │
│         [View Detailed Analytics]       │
└─────────────────────────────────────────┘
```

**Features:**

- Status badge (success/warning/danger)
- Trend sparkline with delta
- Sentiment chips with emojis
- Leading competitor badge
- Citations count
- Hover-to-remove (top right ×)

**Child Components:**

- **MiniSparkline:** Trend visualization
- **Button:** View details action

---

### OverallStatsCard

**Location:** `frontend/src/components/OverallStatsCard.tsx`

**Purpose:** Aggregated statistics across all tracked queries.

**Props:**

```typescript
type OverallStatsCardProps = {
  performance: QueryPerformance[];
  maxQueries: number;  // 20
};
```

**Computed Metrics:**

```typescript
// Filter out unanalyzed queries
const analyzed = performance.filter(p => p.totalAppearances > 0);

// Coverage
const coverage = (analyzed.length / performance.length) * 100;

// Avg appearance rate
const avgAppearance = analyzed.reduce((sum, p) => sum + p.appearanceRate, 0) / analyzed.length;

// Avg position
const avgPosition = analyzed
  .filter(p => p.avgPosition > 0)
  .reduce((sum, p) => sum + p.avgPosition, 0) / withPositions.length;

// Overall sentiment
const totalSentiment = analyzed.reduce((sum, p) => ({
  positive: sum.positive + p.sentiment.positive,
  neutral: sum.neutral + p.sentiment.neutral,
  negative: sum.negative + p.sentiment.negative
}), { positive: 0, neutral: 0, negative: 0 });
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ Overall Performance                     │
│ 15 / 20 tracked queries                 │
├─────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬───────┐│
│ │ 80%     │ 72%     │ #2.1    │ 😊 65%││
│ │ Coverage│ Appear  │ Avg Pos │ Sent. ││
│ └─────────┴─────────┴─────────┴───────┘│
└─────────────────────────────────────────┘
```

---

### SimplifiedStatsBar

**Location:** `frontend/src/components/SimplifiedStatsBar.tsx`

**Purpose:** Compact stats summary with run analysis button.

**Props:**

```typescript
type SimplifiedStatsBarProps = {
  trackedCount: number;
  maxQueries: number;
  avgAppearanceRate: number;
  avgPosition: number;
  onRunAnalysis: () => void;
  isRunning: boolean;
};
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ 15/20 tracked │ 72% appear │ #2.1 pos   │
│                     [Run Analysis →]    │
└─────────────────────────────────────────┘
```

---

### CitationsDisplay

**Location:** `frontend/src/components/CitationsDisplay.tsx`

**Purpose:** Display web search citations in compact or full mode.

**Props:**

```typescript
type CitationsDisplayProps = {
  citations: Citation[];
  compact?: boolean;  // Default: false
};

type Citation = {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
};
```

**Compact Mode:**

```
🌐 3 sources: example.com, techcrunch.com, forbes.com
```

**Full Mode:**

```
┌─────────────────────────────────────────┐
│ 📄 Best Payment Processors 2025         │
│    example.com                          │
│    "Stripe leads the market with..."    │
│    [Open →]                             │
├─────────────────────────────────────────┤
│ 📄 SaaS Payment Gateway Comparison      │
│    techcrunch.com                       │
│    "PayPal and Stripe dominate..."      │
│    [Open →]                             │
└─────────────────────────────────────────┘
```

---

### CompetitorBadge

**Location:** `frontend/src/components/CompetitorBadge.tsx`

**Purpose:** Badge showing competitor/brand metrics with trend sparkline.

**Props:**

```typescript
type CompetitorBadgeProps = {
  name: string;
  position: number | null;
  appearanceRate: number;
  trendData?: number[];
  isYourBrand?: boolean;  // Default: false
};
```

**Color Coding:**

- **#1 position:** Green
- **Top 3 (2-3):** Yellow
- **Lower (4+):** Red
- **Not mentioned:** Gray

**Layout:**

```
┌──────────────────────┐
│ Stripe               │
│ #1 • 87%    ██▁█████ │
└──────────────────────┘
```

**Child Components:**

- **MiniSparkline:** Trend data

---

## Hooks

### useSession

**Location:** `frontend/src/hooks/useSession.tsx`

**Purpose:** Access authentication and plan context.

**Return Type:**

```typescript
{
  session: Session | null,
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

### useDashboard

**Location:** `frontend/src/hooks/useDashboard.ts`

**Purpose:** Fetch dashboard data (legacy).

**Return Type:**

```typescript
{
  dashboardQuery: UseQueryResult<DashboardResponse>,
  planQuery: UseQueryResult<PlanResponse>,
  analysisMutation: UseMutationResult
}
```

---

## Type Definitions

### API Types

**Location:** `frontend/src/types/api.ts`

```typescript
type Project = {
  id: string;
  userId: string;
  brandName: string;
  keywords: string[];
  competitors: string[];
  trackedQueries: string[];
  createdAt: string;
  updatedAt: string;
};

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

type Citation = {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
};

type DashboardCards = {
  summaryCard: {
    brandMentions: number;
    totalQueries: number;
    queriesWithMentions: number;
    shareOfVoice: Record<string, number>;
  };
  trendCard: {
    series: TrendPoint[];
    delta: number;
  };
  gapCard: GapOpportunity[];
  actionCard: string[];
  sentimentCard: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

type TrendPoint = {
  week: string;
  value: number;
  [brand: string]: string | number;
};

type GapOpportunity = {
  query: string;
  dominatingCompetitor: string;
  recommendation: string;
  gapType?: 'missing' | 'outranked';
};
```

---

## Styling System

**Global Styles:** `frontend/src/styles/global.css`

**System Styles:** `frontend/src/styles/system.css`

**Dashboard Styles:** `frontend/src/styles/dashboard.css`

### CSS Custom Properties

```css
:root {
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --neutral: #6b7280;

  --text-primary: #111827;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border: #e5e7eb;
}
```

---

## Component Patterns

### 1. Container-Presentation Pattern

**Container Component** (Pages):
- Fetches data with React Query
- Manages local state
- Handles mutations
- Passes data to presentation components

**Presentation Component** (Components):
- Receives data via props
- Pure rendering logic
- Callback props for actions

---

### 2. Composition Pattern

**Example: ProjectDashboardPage**

```typescript
<AppShell planTier={plan} navItems={navItems} onSignOut={signOut}>
  <div className="dashboard-layout">
    <aside className="config-sidebar">
      {/* Config form */}
    </aside>
    <main className="dashboard-content">
      <SimplifiedStatsBar {...statsProps} />
      <OverallStatsCard performance={performance} />
      <QuerySuggestionsCard suggestions={suggestions} {...handlers} />
      {performance.map(p => (
        <QueryPerformanceCardNew key={p.query} performance={p} {...handlers} />
      ))}
    </main>
  </div>
</AppShell>
```

---

### 3. Modal Pattern

**State Management:**

```typescript
const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
```

**Conditional Render:**

```typescript
{selectedQuery && (
  <QueryDetailModal
    projectId={projectId}
    queryText={selectedQuery}
    brandName={brandName}
    competitors={competitors}
    onClose={() => setSelectedQuery(null)}
  />
)}
```

**Modal Component:**

```typescript
function QueryDetailModal({ onClose, ...props }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal content */}
      </div>
    </div>
  );
}
```

---

### 4. Loading States

```typescript
if (query.isLoading) {
  return <div className="loading">Loading...</div>;
}

if (query.error) {
  return <div className="error">Error: {query.error.message}</div>;
}

if (!query.data) {
  return <div className="empty">No data available</div>;
}

return <Content data={query.data} />;
```

---

## Best Practices

### 1. Type Safety

Always define prop types:

```typescript
type MyComponentProps = {
  required: string;
  optional?: number;
};

function MyComponent({ required, optional = 0 }: MyComponentProps) {
  // ...
}
```

---

### 2. React Query Patterns

**Query Keys:**

```typescript
// Good: Hierarchical
['project', projectId]
['query-performance', projectId]

// Bad: Flat
['projectData']
```

**Invalidation:**

```typescript
// After mutation
onSuccess: () => {
  queryClient.invalidateQueries(['project', projectId]);
  queryClient.invalidateQueries(['query-performance', projectId]);
}
```

---

### 3. Event Handlers

**Named functions for clarity:**

```typescript
const handleTrackQuery = (query: string) => {
  trackMutation.mutate(query);
};

const handleDeleteProject = async () => {
  if (confirm('Delete project?')) {
    await deleteMutation.mutateAsync();
    navigate('/projects');
  }
};
```

---

### 4. Conditional Rendering

**Use early returns:**

```typescript
if (!data) return null;
if (loading) return <Loading />;
if (error) return <Error />;

return <Content data={data} />;
```

---

## File Structure

```
frontend/src/
├── api/
│   └── index.ts              # API client functions
├── components/
│   ├── AppShell.tsx
│   ├── BulkTrackModal.tsx
│   ├── Button.tsx
│   ├── CitationsDisplay.tsx
│   ├── CompetitorBadge.tsx
│   ├── MiniSparkline.tsx
│   ├── OverallStatsCard.tsx
│   ├── QueryBuilder.tsx
│   ├── QueryDetailModal.tsx
│   ├── QueryPerformanceCardNew.tsx
│   ├── QuerySuggestionsCard.tsx
│   ├── QueryTrendChart.tsx
│   └── ...
├── hooks/
│   ├── useSession.tsx        # Auth context
│   └── useDashboard.ts       # Dashboard hook (legacy)
├── pages/
│   ├── LandingPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDashboardPage.tsx
│   └── QueryDetailPage.tsx
├── styles/
│   ├── global.css
│   ├── system.css
│   └── dashboard.css
├── types/
│   └── api.ts                # Type definitions
├── App.tsx                   # Router config
└── main.tsx                  # App entry point
```

---

**For more information, see:**
- [Template Contexts Documentation](./TEMPLATE_CONTEXTS.md)
- [Backend API Reference](./BACKEND_API_REFERENCE.md)
- [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md)
