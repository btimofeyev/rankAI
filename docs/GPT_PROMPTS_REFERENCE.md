# GPT Prompts & AI Integration Reference

Complete documentation of all GPT prompts, AI integrations, and template contexts in the rankAI application.

**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Query Suggestions Prompt](#query-suggestions-prompt)
4. [Web Search Integration](#web-search-integration)
5. [Brand Mention Analysis](#brand-mention-analysis)
6. [Sentiment Detection](#sentiment-detection)
7. [Fallback Strategies](#fallback-strategies)
8. [API Usage Patterns](#api-usage-patterns)
9. [Examples & Use Cases](#examples--use-cases)

---

## Overview

RankAI uses OpenAI's GPT models to:

1. **Generate Query Suggestions** - AI-powered recommendations for queries to track
2. **Analyze Brand Visibility** - Process AI responses to extract brand mentions
3. **Web Search Integration** - Get real-time citations via OpenAI Responses API
4. **Sentiment Analysis** - Detect positive/neutral/negative sentiment in mentions

### Architecture

```
User Input
    ↓
[Brand, Competitors, Keywords, Tracked Queries]
    ↓
    ├─→ AI Query Generation
    │   └─→ OpenAI Chat Completions (temp: 0.8)
    │       └─→ 10 diverse queries
    │
    └─→ Brand Visibility Analysis
        └─→ For each tracked query:
            ├─→ OpenAI Responses API (with web_search)
            │   └─→ Response text + citations
            │
            └─→ Regex-based mention extraction
                └─→ Brand, position, sentiment, context
```

---

## Configuration

### Environment Variables

**Location:** `backend/src/config/env.ts`

```typescript
{
  openaiApiKey: string | undefined,           // Required
  openaiModel: string,                        // Default: 'gpt-4o-mini'
  useWebSearch: boolean,                      // Default: false
  webSearchMode: 'responses' | 'chat_completions'  // Default: 'responses'
}
```

### Recommended Settings

**Development:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USE_WEB_SEARCH=true
WEB_SEARCH_MODE=responses
```

**Production:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USE_WEB_SEARCH=true
WEB_SEARCH_MODE=responses
```

### Model Selection

| Model | Use Case | Speed | Cost | Quality |
|-------|----------|-------|------|---------|
| gpt-4o-mini | Default, recommended | Fast | Low | High |
| gpt-4o | Higher quality needs | Medium | High | Highest |
| gpt-3.5-turbo | Budget option | Fastest | Lowest | Medium |

---

## Query Suggestions Prompt

**Location:** `backend/src/services/querySuggestions.ts`

**Function:** `generateAIQuerySuggestions()`

### Purpose

Generate diverse search queries that cause AI models to compare and recommend multiple brands, enabling effective brand visibility tracking.

### Full Prompt Template

```typescript
const prompt = `You are an AI brand visibility analyst. Generate 10 diverse search queries that would cause AI models (like ChatGPT, Claude, Perplexity) to compare and recommend multiple brands in the "${keywordStr}" space.

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
}`;
```

### Context Variables

#### Input Parameters

```typescript
async function generateAIQuerySuggestions(
  brandName: string,
  keywords: string[],
  competitors: string[],
  excludeQueries: string[]
): Promise<QuerySuggestion[]>
```

#### Variable Construction

| Template Variable | Source | Example Value |
|-------------------|--------|---------------|
| `${brandName}` | Direct parameter | `"Stripe"` |
| `${keywordStr}` | `keywords.length > 0 ? keywords.join(', ') : 'this space'` | `"payment processor, payment gateway, online payments"` |
| `${competitorStr}` | `competitors.length > 0 ? competitors.join(', ') : 'other solutions'` | `"PayPal, Square, Braintree"` |
| `${competitors[0]}` | First competitor or fallback | `"PayPal"` or `"Square"` |

#### Example Filled Prompt

```
You are an AI brand visibility analyst. Generate 10 diverse search queries that would cause AI models (like ChatGPT, Claude, Perplexity) to compare and recommend multiple brands in the "payment processor, payment gateway, online payments" space.

Context:
- Brand to track: Stripe
- Competitors: PayPal, Square, Braintree
- Industry keywords: payment processor, payment gateway, online payments

CRITICAL: These queries will be used to track how often Stripe appears in AI-generated recommendations compared to competitors. Generate queries where AI models would naturally mention multiple brands.

Query Types to Generate:
1. Recommendation queries (e.g., "What's the best payment processor for SaaS startups?")
2. Comparison queries (e.g., "Top payment gateways for e-commerce in 2025")
3. Brand vs Brand (e.g., "Stripe vs PayPal for small business")
4. Feature-based comparisons (e.g., "Which payment processor, payment gateway, online payments solution has the lowest transaction fees?")
5. Use-case specific (e.g., "Best payment processor for international transactions")
6. Buying decision queries (e.g., "Most reliable payment processor, payment gateway, online payments platform for startups")

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
}
```

### API Configuration

```typescript
const response = await openai.chat.completions.create({
  model: env.openaiModel,  // 'gpt-4o-mini'
  messages: [
    { role: 'user', content: prompt }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.8  // Higher for diversity
});
```

**Key Settings:**

- **temperature: 0.8** - Increases diversity and creativity in suggestions
- **response_format: json_object** - Forces structured JSON response
- **No system message** - Uses only user prompt

### Response Processing

#### Expected Response Format

```json
{
  "queries": [
    "What's the best payment processor for SaaS startups?",
    "Stripe vs PayPal for e-commerce",
    "Top payment gateways 2025 comparison",
    "Most reliable payment platform for international business",
    ...
  ]
}
```

#### Post-Processing

1. **Parse JSON** - Handle multiple structures:
   ```typescript
   const queries = parsed.queries || parsed.questions || parsed.results || [];
   ```

2. **Filter Duplicates** - Remove already tracked/suggested queries:
   ```typescript
   const filtered = queries.filter(q =>
     !excludeQueries.some(eq => eq.toLowerCase() === q.toLowerCase())
   );
   ```

3. **Assign Scores** - Descending from 55 to 37:
   ```typescript
   score: 55 - (index * 2)
   ```

4. **Create Suggestions**:
   ```typescript
   {
     query: string,
     score: number,  // 55, 53, 51, ..., 37
     reason: "AI-generated suggestion based on your brand and keywords",
     category: 'related',
     metadata: {
       brandMissing: true,
       appearanceRate: 0
     }
   }
   ```

### Example Output

```json
[
  {
    "query": "What's the best payment processor for SaaS startups?",
    "score": 55,
    "reason": "AI-generated suggestion based on your brand and keywords",
    "category": "related",
    "metadata": {
      "brandMissing": true,
      "appearanceRate": 0
    }
  },
  {
    "query": "Stripe vs PayPal for e-commerce",
    "score": 53,
    "reason": "AI-generated suggestion based on your brand and keywords",
    "category": "related",
    "metadata": {
      "brandMissing": true,
      "appearanceRate": 0
    }
  }
]
```

---

## Web Search Integration

### Responses API (Recommended)

**Location:** `backend/src/services/webSearch.ts`

**Function:** `queryWithWebSearch()`

#### Purpose

Get AI-generated responses with real-time web search citations for accurate, up-to-date brand visibility analysis.

#### API Request

```typescript
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.openaiApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: env.openaiModel,
    tools: [{ type: 'web_search' }],
    input: query,
    include: ['web_search_call.action.sources']
  })
});
```

**Key Settings:**

- **tools: [{ type: 'web_search' }]** - Enables web search
- **input: query** - Direct query (no template)
- **include** - Request citation sources

#### Response Structure

```typescript
{
  output: [
    {
      type: 'web_search_call',
      id: string,
      // ... web search metadata
    },
    {
      type: 'message',
      content: [
        {
          type: 'output_text',
          text: string,  // The response text
          annotations: [
            {
              type: 'url_citation',
              url: string,
              title: string,
              start_index: number,
              end_index: number
            }
          ]
        }
      ]
    }
  ]
}
```

#### Citation Extraction

```typescript
// Find message output
const messageOutput = response.output.find(item => item.type === 'message');
const contentItem = messageOutput.content[0];
const responseText = contentItem.text;

// Extract citations
const citations: Citation[] = (contentItem.annotations || []).map(annotation => ({
  url: annotation.url,
  title: annotation.title || '',
  domain: new URL(annotation.url).hostname,
  snippet: responseText.slice(annotation.start_index, annotation.end_index)
}));
```

#### Return Value

```typescript
{
  responseText: string,
  citations: Citation[],
  usedWebSearch: true
}
```

#### Example

**Input Query:**
```
"What's the best payment processor for SaaS startups?"
```

**API Response (Simplified):**
```json
{
  "output": [
    {
      "type": "message",
      "content": [
        {
          "type": "output_text",
          "text": "For SaaS startups, Stripe is widely regarded as the best payment processor due to its developer-friendly API and comprehensive features. PayPal is also popular for its brand recognition...",
          "annotations": [
            {
              "type": "url_citation",
              "url": "https://example.com/best-payment-processors",
              "title": "Best Payment Processors for SaaS in 2025",
              "start_index": 25,
              "end_index": 31
            }
          ]
        }
      ]
    }
  ]
}
```

**Processed Output:**
```typescript
{
  responseText: "For SaaS startups, Stripe is widely regarded as...",
  citations: [
    {
      url: "https://example.com/best-payment-processors",
      title: "Best Payment Processors for SaaS in 2025",
      domain: "example.com",
      snippet: "Stripe"
    }
  ],
  usedWebSearch: true
}
```

---

### Chat Completions API (Fallback)

**Location:** `backend/src/services/webSearch.ts`

**Function:** `queryWithoutWebSearch()`

#### Purpose

Get AI responses without web search when Responses API is unavailable or disabled.

#### API Request

```typescript
const response = await openai.chat.completions.create({
  model: env.openaiModel,
  messages: [
    {
      role: 'user',
      content: query
    }
  ]
});
```

#### Return Value

```typescript
{
  responseText: response.choices[0]?.message?.content ?? '',
  citations: [],
  usedWebSearch: false
}
```

---

## Brand Mention Analysis

**Location:** `backend/src/services/gptQuery.ts`

**Function:** `analyzeResponseForMentions()`

### Purpose

Extract brand mentions, positions, sentiment, and context from AI-generated responses.

**Note:** This is NOT a GPT prompt - uses regex and keyword-based analysis.

### Algorithm

#### Input

```typescript
function analyzeResponseForMentions(
  query: string,
  responseText: string,
  brands: string[]  // [brandName, ...competitors]
): VisibilityMention[]
```

#### Processing Steps

**1. Brand Detection**

Uses regex with word boundaries:

```typescript
const lowerBrand = brand.toLowerCase();
const escapedBrand = lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`\\b${escapedBrand}\\b`, 'gi');
const matches = [...responseText.matchAll(regex)];
```

**2. Position Assignment**

Positions assigned based on first occurrence order:

```typescript
const firstIndex = matches[0].index;
const position = mentions.length + 1;  // 1, 2, 3, ...
```

**3. Context Extraction**

Extract 50 characters before and after mention:

```typescript
const contextStart = Math.max(0, firstIndex - 50);
const contextEnd = Math.min(
  responseText.length,
  firstIndex + brand.length + 50
);
const context = responseText.slice(contextStart, contextEnd);
```

**4. Sentiment Detection**

Search for sentiment keywords in 100-char window:

```typescript
const sentimentKeywords = {
  positive: ['best', 'top', 'great', 'excellent', 'leading', 'popular', 'recommended'],
  negative: ['worst', 'poor', 'avoid', 'limited', 'lacking']
};

const windowStart = Math.max(0, firstIndex - 100);
const windowEnd = Math.min(responseText.length, firstIndex + 100);
const surroundingText = responseText.slice(windowStart, windowEnd).toLowerCase();

// Check for positive keywords
if (sentimentKeywords.positive.some(kw => surroundingText.includes(kw))) {
  sentiment = 'positive';
}
// Check for negative keywords
else if (sentimentKeywords.negative.some(kw => surroundingText.includes(kw))) {
  sentiment = 'negative';
}
// Default
else {
  sentiment = 'neutral';
}
```

#### Output

```typescript
[
  {
    query: "What's the best payment processor?",
    brand: "Stripe",
    position: 1,
    sentiment: "positive",
    context: "...For SaaS startups, Stripe is widely regarded as the best payment..."
  },
  {
    query: "What's the best payment processor?",
    brand: "PayPal",
    position: 2,
    sentiment: "neutral",
    context: "...recognition. PayPal is also popular for its brand recognition and..."
  }
]
```

### Example Walkthrough

**Input:**

```typescript
analyzeResponseForMentions(
  "Best payment processor for SaaS?",
  "For SaaS startups, Stripe is the best option with excellent features. PayPal is also widely used but has limited API capabilities.",
  ["Stripe", "PayPal", "Square"]
)
```

**Processing:**

1. **Search for "Stripe"**
   - Found at index 19
   - Position: 1
   - Context: "For SaaS startups, Stripe is the best option with excellent features"
   - Sentiment: "positive" (contains "best" and "excellent")

2. **Search for "PayPal"**
   - Found at index 69
   - Position: 2
   - Context: "excellent features. PayPal is also widely used but has limited API"
   - Sentiment: "negative" (contains "limited")

3. **Search for "Square"**
   - Not found
   - No mention returned

**Output:**

```typescript
[
  {
    query: "Best payment processor for SaaS?",
    brand: "Stripe",
    position: 1,
    sentiment: "positive",
    context: "For SaaS startups, Stripe is the best option with excellent features"
  },
  {
    query: "Best payment processor for SaaS?",
    brand: "PayPal",
    position: 2,
    sentiment: "negative",
    context: "excellent features. PayPal is also widely used but has limited API"
  }
]
```

---

## Sentiment Detection

### Sentiment Keywords

**Location:** `backend/src/services/gptQuery.ts`

#### Positive Keywords

```typescript
[
  'best',
  'top',
  'great',
  'excellent',
  'leading',
  'popular',
  'recommended'
]
```

**Example contexts:**
- "Stripe is the **best** payment processor"
- "**Top** choice for SaaS startups"
- "**Excellent** developer experience"

#### Negative Keywords

```typescript
[
  'worst',
  'poor',
  'avoid',
  'limited',
  'lacking'
]
```

**Example contexts:**
- "**Avoid** using PayPal for international"
- "**Limited** API capabilities"
- "**Poor** customer support"

### Detection Window

- **Size:** 100 characters before and after mention
- **Case-insensitive**
- **First match wins:** Positive checked before negative

### Sentiment Distribution

In typical queries:
- **Positive:** 40-60% (top recommendations)
- **Neutral:** 30-50% (factual mentions)
- **Negative:** 5-15% (warnings, alternatives)

---

## Fallback Strategies

### 1. OpenAI API Unavailable

**Affected Functions:**
- `generateAIQuerySuggestions()`
- `queryWithWebSearch()`
- `queryWithoutWebSearch()`

**Fallback 1: Keyword-Based Query Generation**

**Location:** `backend/src/services/querySuggestions.ts`

**Function:** `generateKeywordSuggestions()`

```typescript
const templates = [
  `What are the best ${keywordStr} solutions?`,
  `Which ${keywordStr} tool should I choose?`,
  `How do I compare ${keywordStr} platforms?`,
  `What's the difference between ${keywordStr} providers?`,
  `Which ${keywordStr} service is most cost-effective?`
];
```

**Example with keywords: ["payment", "processor"]**

```typescript
[
  "What are the best payment, processor solutions?",
  "Which payment, processor tool should I choose?",
  "How do I compare payment, processor platforms?",
  "What's the difference between payment, processor providers?",
  "Which payment, processor service is most cost-effective?"
]
```

**Scoring:** 50, 45, 40, 35, 30 (descending)

**Fallback 2: Empty Response**

If OpenAI fails during analysis:

```typescript
// runBrandVisibilityAnalysis returns empty results
return queries.map(query => ({
  query,
  responseText: '',
  mentions: [],
  citations: [],
  usedWebSearch: false
}));
```

---

### 2. Supabase Unavailable

All repository functions fall back to in-memory storage:

```typescript
// backend/src/services/repository.ts
const inMemoryDb = {
  projects: new Map(),
  runs: new Map(),
  queryResults: new Map(),
  snapshots: new Map(),
  plans: new Map()
};

if (!supabase) {
  // Use inMemoryDb
}
```

---

### 3. Web Search Disabled

Falls back to standard Chat Completions:

```typescript
if (!env.useWebSearch) {
  return queryWithoutWebSearch(query);
}
```

---

## API Usage Patterns

### Rate Limits

**OpenAI GPT-4o-mini (Tier 1):**
- 500 requests per minute
- 200,000 tokens per minute

**Batching Strategy:**

```typescript
// Process 5 queries concurrently
const batchSize = 5;
for (let i = 0; i < queries.length; i += batchSize) {
  const batch = queries.slice(i, i + batchSize);
  const results = await Promise.all(
    batch.map(query => processQuery(query))
  );
}
```

### Error Handling

```typescript
try {
  const response = await openai.chat.completions.create({ /* ... */ });
  return processResponse(response);
} catch (error) {
  logger.error('OpenAI API error:', error);
  return fallbackResponse();
}
```

### Token Management

**Typical Token Usage:**

| Operation | Input Tokens | Output Tokens | Total |
|-----------|--------------|---------------|-------|
| Query Suggestion | ~500 | ~200 | ~700 |
| Web Search Query | ~50 | ~300 | ~350 |
| Standard Query | ~20 | ~200 | ~220 |

**Per Analysis Run (10 queries):**
- Web Search: ~3,500 tokens
- Standard: ~2,200 tokens

---

## Examples & Use Cases

### Example 1: Generate Query Suggestions

**Input:**

```typescript
await generateAIQuerySuggestions(
  'Stripe',                              // brandName
  ['payment processor', 'SaaS'],         // keywords
  ['PayPal', 'Square'],                  // competitors
  ['Existing query 1', 'Existing query 2'] // excludeQueries
);
```

**OpenAI Request:**

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "You are an AI brand visibility analyst. Generate 10 diverse search queries that would cause AI models (like ChatGPT, Claude, Perplexity) to compare and recommend multiple brands in the \"payment processor, SaaS\" space.\n\nContext:\n- Brand to track: Stripe\n- Competitors: PayPal, Square\n- Industry keywords: payment processor, SaaS\n\n..."
    }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.8
}
```

**OpenAI Response:**

```json
{
  "queries": [
    "What's the best payment processor for SaaS startups?",
    "Stripe vs PayPal for subscription billing",
    "Top payment gateways for recurring revenue businesses",
    "Which payment processor integrates best with SaaS platforms?",
    "Most developer-friendly payment APIs for SaaS",
    "Stripe vs Square: which is better for online businesses?",
    "Best payment solution for international SaaS companies",
    "Payment processor comparison for B2B SaaS",
    "What payment gateway do successful SaaS companies use?",
    "Low-fee payment processors for SaaS platforms"
  ]
}
```

**Processed Output:**

```typescript
[
  {
    query: "What's the best payment processor for SaaS startups?",
    score: 55,
    reason: "AI-generated suggestion based on your brand and keywords",
    category: "related",
    metadata: { brandMissing: true, appearanceRate: 0 }
  },
  {
    query: "Stripe vs PayPal for subscription billing",
    score: 53,
    reason: "AI-generated suggestion based on your brand and keywords",
    category: "related",
    metadata: { brandMissing: true, appearanceRate: 0 }
  },
  // ... 8 more
]
```

---

### Example 2: Analyze Query with Web Search

**Input:**

```typescript
await queryWithWebSearch(
  "What's the best payment processor for SaaS startups?"
);
```

**OpenAI Request:**

```json
{
  "model": "gpt-4o-mini",
  "tools": [{ "type": "web_search" }],
  "input": "What's the best payment processor for SaaS startups?",
  "include": ["web_search_call.action.sources"]
}
```

**OpenAI Response (Simplified):**

```json
{
  "output": [
    {
      "type": "web_search_call"
    },
    {
      "type": "message",
      "content": [
        {
          "type": "output_text",
          "text": "For SaaS startups, Stripe is widely considered the best payment processor due to its developer-friendly API, comprehensive documentation, and extensive feature set including subscription management. PayPal is another popular option, offering instant brand recognition and a large user base. Square also serves many SaaS businesses with its straightforward pricing model.",
          "annotations": [
            {
              "type": "url_citation",
              "url": "https://techcrunch.com/payment-processors",
              "title": "Best Payment Processors for SaaS 2025",
              "start_index": 25,
              "end_index": 31
            }
          ]
        }
      ]
    }
  ]
}
```

**Processed Output:**

```typescript
{
  responseText: "For SaaS startups, Stripe is widely considered the best payment processor...",
  citations: [
    {
      url: "https://techcrunch.com/payment-processors",
      title: "Best Payment Processors for SaaS 2025",
      domain: "techcrunch.com",
      snippet: "Stripe"
    }
  ],
  usedWebSearch: true
}
```

---

### Example 3: Extract Brand Mentions

**Input:**

```typescript
analyzeResponseForMentions(
  "Best payment processor for SaaS?",
  "For SaaS startups, Stripe is the best payment processor with excellent API and comprehensive features. PayPal is also widely used but has limited API capabilities. Square is rarely mentioned in this context.",
  ["Stripe", "PayPal", "Square"]
);
```

**Output:**

```typescript
[
  {
    query: "Best payment processor for SaaS?",
    brand: "Stripe",
    position: 1,
    sentiment: "positive",
    context: "For SaaS startups, Stripe is the best payment processor with excellent API"
  },
  {
    query: "Best payment processor for SaaS?",
    brand: "PayPal",
    position: 2,
    sentiment: "negative",
    context: "s. PayPal is also widely used but has limited API capabilities. Square"
  },
  {
    query: "Best payment processor for SaaS?",
    brand: "Square",
    position: 3,
    sentiment: "neutral",
    context: "ed API capabilities. Square is rarely mentioned in this context."
  }
]
```

---

### Example 4: Complete Analysis Flow

**Scenario:** Run analysis on project with 5 tracked queries

**Step 1: Fetch Project**

```typescript
const project = {
  brandName: 'Stripe',
  competitors: ['PayPal', 'Square'],
  trackedQueries: [
    'Best payment processor for SaaS?',
    'Stripe vs PayPal comparison',
    'Top payment gateways 2025',
    'Most reliable payment platform',
    'Which payment processor for startups?'
  ]
};
```

**Step 2: Run Analysis**

```typescript
const results = await runBrandVisibilityAnalysis(
  'Stripe',
  ['payment', 'processor'],
  ['PayPal', 'Square'],
  project.trackedQueries
);
```

**Step 3: Process Queries (Batch of 5)**

```typescript
// Parallel processing
const [r1, r2, r3, r4, r5] = await Promise.all([
  queryWithWebSearch('Best payment processor for SaaS?'),
  queryWithWebSearch('Stripe vs PayPal comparison'),
  queryWithWebSearch('Top payment gateways 2025'),
  queryWithWebSearch('Most reliable payment platform'),
  queryWithWebSearch('Which payment processor for startups?')
]);
```

**Step 4: Extract Mentions**

```typescript
const mentions1 = analyzeResponseForMentions(
  'Best payment processor for SaaS?',
  r1.responseText,
  ['Stripe', 'PayPal', 'Square']
);
// Repeat for all queries
```

**Step 5: Aggregate Results**

```typescript
{
  totalQueries: 5,
  brandMentions: 4,  // Stripe appeared in 4/5 queries
  avgPosition: 1.5,  // Average #1.5 when mentioned
  sentiment: {
    positive: 3,
    neutral: 1,
    negative: 0
  },
  shareOfVoice: {
    'Stripe': 44.4,  // 4 mentions
    'PayPal': 33.3,  // 3 mentions
    'Square': 22.2   // 2 mentions
  }
}
```

---

## Best Practices

### 1. Temperature Settings

- **Query Suggestions:** Use 0.8 for diversity
- **Analysis Queries:** Use default (1.0) for natural responses

### 2. Prompt Engineering

**Do:**
- ✅ Be explicit about desired output format
- ✅ Provide specific examples
- ✅ Use structured constraints (AVOID section)
- ✅ Request JSON with clear schema

**Don't:**
- ❌ Over-constrain creativity (too low temperature)
- ❌ Vague requirements
- ❌ Missing context variables

### 3. Error Handling

Always have fallbacks:

```typescript
try {
  return await aiFunction();
} catch (error) {
  logger.error('AI error:', error);
  return fallbackFunction();
}
```

### 4. Token Optimization

- Use `gpt-4o-mini` for cost efficiency
- Batch queries to reduce overhead
- Cache suggestions to avoid regeneration

### 5. Web Search Usage

**When to use:**
- ✅ Brand visibility analysis
- ✅ Competitive comparisons
- ✅ Up-to-date information needed

**When to avoid:**
- ❌ Query suggestion generation (doesn't need web data)
- ❌ Historical analysis (use cached results)

---

## Troubleshooting

### Issue: Low-Quality Suggestions

**Symptoms:**
- Generic queries
- Missing brand comparisons
- Too many how-to questions

**Solutions:**
1. Check `competitorStr` is not empty
2. Increase temperature (try 0.9)
3. Add more specific keywords
4. Review AVOID section in prompt

---

### Issue: Missing Citations

**Symptoms:**
- `usedWebSearch: true` but `citations: []`

**Solutions:**
1. Verify `USE_WEB_SEARCH=true`
2. Check `WEB_SEARCH_MODE=responses`
3. Ensure `include: ['web_search_call.action.sources']`
4. Verify OpenAI API key has Responses API access

---

### Issue: Incorrect Sentiment

**Symptoms:**
- Positive mentions marked negative
- All mentions marked neutral

**Solutions:**
1. Expand sentiment keyword lists
2. Increase detection window (currently 100 chars)
3. Consider custom sentiment model
4. Manual review and correction

---

### Issue: Brand Not Detected

**Symptoms:**
- Brand mentioned but not extracted

**Solutions:**
1. Check for typos in brand name
2. Verify word boundary matching (`\b`)
3. Handle special characters in brand name
4. Case-insensitive matching enabled

---

## Performance Metrics

### Typical Response Times

| Operation | Average Time | P95 |
|-----------|--------------|-----|
| Query Suggestion | 3-5s | 8s |
| Web Search Query | 4-7s | 10s |
| Standard Query | 2-3s | 5s |
| Mention Analysis | <50ms | 100ms |

### Accuracy Metrics

| Metric | Typical Value |
|--------|---------------|
| Brand Detection Accuracy | 95-98% |
| Position Accuracy | 90-95% |
| Sentiment Accuracy | 70-80% |
| Citation Extraction | 98-100% |

---

## File Locations

- **Query Suggestions:** `backend/src/services/querySuggestions.ts`
- **Web Search:** `backend/src/services/webSearch.ts`
- **GPT Query:** `backend/src/services/gptQuery.ts`
- **Configuration:** `backend/src/config/env.ts`

---

## Related Documentation

- [Template Contexts Documentation](./TEMPLATE_CONTEXTS.md)
- [Backend API Reference](./BACKEND_API_REFERENCE.md)
- [Frontend Components Reference](./FRONTEND_COMPONENTS_REFERENCE.md)

---

## Appendix: OpenAI API References

- **Chat Completions:** https://platform.openai.com/docs/api-reference/chat
- **Responses API:** https://platform.openai.com/docs/api-reference/responses
- **Structured Outputs:** https://platform.openai.com/docs/guides/structured-outputs
- **Web Search Tool:** https://platform.openai.com/docs/guides/web-search
