# RankAI Documentation

Complete documentation for the rankAI brand visibility tracking platform.

**Last Updated:** 2025-10-13

---

## Overview

RankAI is an AI-powered brand visibility tracking platform that monitors how brands appear in AI-generated responses compared to competitors. The system analyzes brand mentions, positions, sentiment, and provides actionable insights for improving brand visibility.

---

## Documentation Structure

### 📘 [Template Contexts Documentation](./TEMPLATE_CONTEXTS.md)

**Main documentation covering all template contexts in the application.**

Topics:
- Application architecture overview
- GPT/AI prompt templates with full context variables
- API endpoint request/response templates
- React component prop interfaces
- Data flow diagrams
- Environment configuration
- Complete type definitions

**Start here for:** Comprehensive understanding of all data structures and contexts.

---

### 🔌 [Backend API Reference](./BACKEND_API_REFERENCE.md)

**Complete REST API documentation for backend services.**

Topics:
- All 30+ API endpoints with examples
- Request/response schemas
- Authentication requirements
- Service function signatures
- Error handling and status codes
- Database schema
- Rate limits and plan tiers

**Start here for:** API integration, backend development, or understanding data persistence.

---

### ⚛️ [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md)

**Complete React component library documentation.**

Topics:
- All 29 components (5 pages + 24 components)
- Prop type definitions with examples
- Component composition patterns
- React Query data fetching
- State management
- Styling system
- UI patterns and best practices

**Start here for:** Frontend development, component usage, or UI customization.

---

### 🤖 [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md)

**Deep dive into all AI/GPT integrations and prompts.**

Topics:
- Complete GPT prompt templates
- AI query suggestion system
- Web search integration (Responses API)
- Brand mention analysis algorithms
- Sentiment detection logic
- Fallback strategies
- API usage patterns and optimization

**Start here for:** Understanding AI features, prompt engineering, or integrating new AI capabilities.

---

## Quick Start

### Understanding the System

1. **Read:** [Template Contexts](./TEMPLATE_CONTEXTS.md) - Overview and architecture
2. **Explore:** [Backend API](./BACKEND_API_REFERENCE.md) - API endpoints
3. **Build:** [Frontend Components](./FRONTEND_COMPONENTS_REFERENCE.md) - UI components
4. **Optimize:** [GPT Prompts](./GPT_PROMPTS_REFERENCE.md) - AI integration

### Common Tasks

#### Task: Add a New API Endpoint

1. Read: [Backend API Reference](./BACKEND_API_REFERENCE.md) - See existing patterns
2. Reference: [Template Contexts](./TEMPLATE_CONTEXTS.md) - Understand data structures
3. Location: `backend/src/routes/` - Add route
4. Location: `backend/src/services/` - Add business logic

#### Task: Create a New Component

1. Read: [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md) - See existing patterns
2. Reference: [Template Contexts](./TEMPLATE_CONTEXTS.md) - Understand prop types
3. Location: `frontend/src/components/` - Create component
4. Style: `frontend/src/styles/` - Add styles

#### Task: Modify GPT Prompts

1. Read: [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md) - Understand current prompts
2. Location: `backend/src/services/querySuggestions.ts` - Query suggestions
3. Location: `backend/src/services/webSearch.ts` - Web search integration
4. Test: Temperature, keywords, examples

---

## Key Concepts

### Template Contexts

A **template context** refers to any data structure, variable set, or configuration passed to:
- GPT prompts (AI query generation, analysis)
- API endpoints (request/response bodies)
- React components (props, state)
- Service functions (parameters, return values)

### Data Flow

```
User Input (Brand, Competitors, Keywords, Queries)
    ↓
Backend API (Express + TypeScript)
    ↓
Service Layer (GPT Query, Web Search, Analytics)
    ↓
OpenAI API (GPT-4o-mini with Web Search)
    ↓
Data Processing (Mention extraction, sentiment analysis)
    ↓
Database (Supabase PostgreSQL)
    ↓
Frontend API (React Query)
    ↓
React Components (Display, visualization)
```

### Core Entities

- **Project:** Brand tracking configuration with tracked queries
- **Analysis Run:** Execution of tracked queries
- **Query Result:** Single query execution with brand mentions and citations
- **Snapshot:** Historical data point for trend tracking
- **Query Suggestion:** AI-generated or data-driven recommendation

---

## Technology Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o-mini
- **Billing:** Stripe
- **Auth:** Supabase Auth

### Frontend
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts
- **Build:** Vite

---

## Environment Setup

### Backend Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-...

# Optional
PORT=4000
OPENAI_MODEL=gpt-4o-mini
USE_WEB_SEARCH=true
WEB_SEARCH_MODE=responses
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## API Overview

### Authentication

All protected endpoints require JWT:

```bash
Authorization: Bearer <supabase_jwt_token>
```

### Base URL

```
http://localhost:4000/api
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create brand tracking project |
| GET | `/projects/:id` | Get project with dashboard |
| POST | `/projects/:id/analyze` | Run brand visibility analysis |
| GET | `/projects/:id/query-performance` | Get query metrics |
| GET | `/projects/:id/query-suggestions` | Get AI suggestions |
| GET | `/projects/:id/query-trends/:query` | Get detailed trends |

See [Backend API Reference](./BACKEND_API_REFERENCE.md) for complete list.

---

## Component Overview

### Page Components

| Component | Route | Purpose |
|-----------|-------|---------|
| LandingPage | `/` | Sign up/login |
| ProjectsPage | `/projects` | List and create projects |
| ProjectDashboardPage | `/projects/:id` | Main project dashboard |
| QueryDetailPage | `/projects/:id/queries` | Detailed query history |

### Key UI Components

| Component | Purpose |
|-----------|---------|
| AppShell | Main app layout with navigation |
| QueryBuilder | Manage tracked queries |
| QuerySuggestionsCard | AI-powered suggestions |
| QueryPerformanceCardNew | Individual query metrics |
| QueryDetailModal | Trend analysis modal |
| BulkTrackModal | Bulk query tracking |

See [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md) for complete list.

---

## GPT Prompts Overview

### 1. Query Suggestions Prompt

**Purpose:** Generate diverse queries that trigger brand comparisons

**Key Variables:**
- `brandName` - Brand to track
- `competitorStr` - Comma-separated competitors
- `keywordStr` - Industry keywords

**Output:** 10 AI-generated queries

**Score Range:** 37-55 (descending)

### 2. Web Search Query

**Purpose:** Get AI response with real-time citations

**API:** OpenAI Responses API with `web_search` tool

**Output:** Response text + citations

### 3. Brand Mention Analysis

**Purpose:** Extract brand mentions from AI responses

**Method:** Regex + keyword-based (not GPT)

**Output:** Brand, position, sentiment, context

See [GPT Prompts Reference](./GPT_PROMPTS_REFERENCE.md) for complete details.

---

## Data Types

### Core Types

```typescript
// Project
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

// Query Performance
type QueryPerformance = {
  query: string;
  totalAppearances: number;
  brandAppearances: number;
  appearanceRate: number;
  avgPosition: number;
  sentiment: { positive: number; neutral: number; negative: number };
  competitorData: Record<string, { appearances: number; avgPosition: number }>;
  citations?: Citation[];
  trendData?: number[];
};

// Query Suggestion
type QuerySuggestion = {
  query: string;
  score: number;
  reason: string;
  category: 'zero_visibility' | 'competitor_gap' | 'high_performer' | 'related';
  metadata: { competitorName?: string; brandMissing: boolean };
};

// Citation
type Citation = {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
};
```

---

## Plan Tiers

### Free Tier
- 1 competitor per project
- 1 analysis per 30 days
- 20 tracked queries
- All features included

### Pro Tier
- 20 competitors per project
- Unlimited analyses
- 20 tracked queries
- Priority support

---

## Troubleshooting

### Common Issues

#### OpenAI API Errors
- Check `OPENAI_API_KEY` is set
- Verify API key has sufficient credits
- Check rate limits (500 req/min for GPT-4o-mini Tier 1)

#### Missing Citations
- Verify `USE_WEB_SEARCH=true`
- Set `WEB_SEARCH_MODE=responses`
- Check OpenAI account has Responses API access

#### Authentication Errors
- Verify Supabase environment variables
- Check JWT token expiration
- Ensure user is authenticated

See individual references for detailed troubleshooting.

---

## Performance

### Typical Response Times

| Operation | Time |
|-----------|------|
| Create Project | <500ms |
| Run Analysis (10 queries) | 20-40s |
| Query Suggestions | 3-8s |
| Load Dashboard | 1-2s |
| View Query Trends | <1s |

### Optimization Tips

1. **Batch Queries:** Process 5 concurrently
2. **Cache Results:** Use React Query caching
3. **Use gpt-4o-mini:** 10x cheaper than gpt-4o
4. **Enable Web Search:** More accurate results

---

## Development Workflow

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## Project Structure

```
rankAI/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── types.ts         # TypeScript types
│   │   └── index.ts         # App entry
│   ├── supabase/            # Database migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS styles
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Router config
│   │   └── main.tsx         # App entry
│   └── package.json
└── docs/                    # Documentation
    ├── README.md
    ├── TEMPLATE_CONTEXTS.md
    ├── BACKEND_API_REFERENCE.md
    ├── FRONTEND_COMPONENTS_REFERENCE.md
    └── GPT_PROMPTS_REFERENCE.md
```

---

## Contributing

When contributing, please:

1. **Update Documentation:** Keep docs in sync with code changes
2. **Follow Patterns:** Use existing patterns from references
3. **Type Safety:** Always define TypeScript types
4. **Test Thoroughly:** Test API endpoints and components
5. **Document Context:** Update template context docs for new data structures

---

## Resources

### External Documentation

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest/docs)
- [React Router Docs](https://reactrouter.com/en/main)
- [Recharts Docs](https://recharts.org/en-US)

### Internal Documentation

- [PRD](../PRD.md) - Product Requirements Document
- [README](../README.md) - Project README

---

## Support

For questions or issues:

1. Check relevant documentation section
2. Review examples in code
3. Search existing issues
4. Create new issue with details

---

## License

[Your License Here]

---

## Changelog

### 2025-10-13
- Initial comprehensive documentation created
- All template contexts documented
- Backend API reference completed
- Frontend components reference completed
- GPT prompts reference completed

---

**Happy building! 🚀**
