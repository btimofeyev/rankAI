import { repository } from './repository.js';
import { VisibilityMention } from '../types.js';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export type QuerySuggestion = {
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

type QueryAnalysis = {
  query: string;
  brandAppearances: number;
  competitorAppearances: Record<string, number>;
  avgBrandPosition: number;
  totalRuns: number;
  brandMissing: boolean;
};

/**
 * Analyzes all queries for a project and returns intelligent suggestions
 * for queries that should be tracked.
 */
export const generateQuerySuggestions = async (
  projectId: string,
  brandName: string,
  competitors: string[],
  trackedQueries: string[],
  keywords: string[]
): Promise<QuerySuggestion[]> => {
  // Get all runs and results
  const runs = await repository.getProjectRuns(projectId);

  if (runs.length === 0) {
    // No data yet - suggest AI-generated or keyword-based queries
    return generateAIQuerySuggestions(brandName, keywords, competitors, trackedQueries);
  }

  // Aggregate query data across all runs
  const queryAnalysis = await analyzeQueries(projectId, brandName, competitors);

  // Check if we have sufficient query diversity
  const uniqueQueries = queryAnalysis.size;
  const untrackedQueries = Array.from(queryAnalysis.keys()).filter(q => !trackedQueries.includes(q));

  logger.info({
    projectId,
    uniqueQueries,
    trackedQueries: trackedQueries.length,
    untrackedQueries: untrackedQueries.length
  }, 'Query suggestion analysis');

  // Generate suggestions based on analysis
  const suggestions: QuerySuggestion[] = [];

  // 1. Zero visibility queries (highest priority)
  const zeroVisibilityQueries = findZeroVisibilityQueries(queryAnalysis, brandName, competitors);
  suggestions.push(...zeroVisibilityQueries);

  // 2. Competitor-dominated queries (defensive)
  const competitorGaps = findCompetitorGaps(queryAnalysis, brandName, competitors);
  suggestions.push(...competitorGaps);

  // 3. High-potential queries (growth)
  const highPotentialQueries = findHighPotentialQueries(queryAnalysis, brandName);
  suggestions.push(...highPotentialQueries);

  // Filter out already tracked queries
  const untracked = suggestions.filter(s => !trackedQueries.includes(s.query));

  // If we have less than 5 suggestions due to low query diversity,
  // supplement with AI-generated suggestions
  if (untracked.length < 5 || uniqueQueries < 3) {
    logger.info({
      currentSuggestions: untracked.length,
      uniqueQueries
    }, 'Low query diversity detected, generating AI suggestions');

    const aiSuggestions = await generateAIQuerySuggestions(
      brandName,
      keywords,
      competitors,
      [...trackedQueries, ...untracked.map(s => s.query)]
    );

    // Add AI suggestions that aren't already in our list
    for (const aiSuggestion of aiSuggestions) {
      if (!untracked.some(s => s.query === aiSuggestion.query)) {
        untracked.push(aiSuggestion);
      }
    }
  }

  // Sort by score (descending) and return top 10
  return untracked
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

/**
 * Analyzes all queries across all runs for the project
 */
const analyzeQueries = async (
  projectId: string,
  brandName: string,
  competitors: string[]
): Promise<Map<string, QueryAnalysis>> => {
  const runs = await repository.getProjectRuns(projectId);
  const queryMap = new Map<string, QueryAnalysis>();

  for (const run of runs) {
    const results = await repository.getRunResults(run.id);

    // Group by query
    const queriesInRun = new Set<string>();
    for (const result of results) {
      queriesInRun.add(result.queryText);
    }

    // Analyze each query
    for (const queryText of queriesInRun) {
      const queryResults = results.filter(r => r.queryText === queryText);

      if (!queryMap.has(queryText)) {
        queryMap.set(queryText, {
          query: queryText,
          brandAppearances: 0,
          competitorAppearances: {},
          avgBrandPosition: 0,
          totalRuns: 0,
          brandMissing: false
        });
      }

      const analysis = queryMap.get(queryText)!;
      analysis.totalRuns++;

      // Count brand appearances
      const brandResults = queryResults.filter(r => r.brand === brandName);
      if (brandResults.length > 0) {
        analysis.brandAppearances++;
        const positions = brandResults
          .filter(r => r.position !== null)
          .map(r => r.position as number);
        if (positions.length > 0) {
          const avgPos = positions.reduce((sum, p) => sum + p, 0) / positions.length;
          analysis.avgBrandPosition = (analysis.avgBrandPosition * (analysis.brandAppearances - 1) + avgPos) / analysis.brandAppearances;
        }
      } else {
        analysis.brandMissing = true;
      }

      // Count competitor appearances
      for (const competitor of competitors) {
        const compResults = queryResults.filter(r => r.brand === competitor);
        if (compResults.length > 0) {
          analysis.competitorAppearances[competitor] = (analysis.competitorAppearances[competitor] || 0) + 1;
        }
      }
    }
  }

  return queryMap;
};

/**
 * Find queries where brand has zero visibility across all runs
 */
const findZeroVisibilityQueries = (
  queryAnalysis: Map<string, QueryAnalysis>,
  brandName: string,
  competitors: string[]
): QuerySuggestion[] => {
  const suggestions: QuerySuggestion[] = [];

  for (const [query, analysis] of queryAnalysis) {
    if (analysis.brandAppearances === 0) {
      // Calculate competitor strength
      const totalCompetitorAppearances = Object.values(analysis.competitorAppearances)
        .reduce((sum, count) => sum + count, 0);

      const competitorStrength = totalCompetitorAppearances / analysis.totalRuns;
      const topCompetitor = getTopCompetitor(analysis.competitorAppearances);

      // Score: 10 (critical) + competitor strength bonus
      const score = 90 + Math.min(competitorStrength * 10, 10);

      suggestions.push({
        query,
        score,
        reason: topCompetitor
          ? `Critical gap - ${topCompetitor} appears but ${brandName} is absent`
          : `Critical gap - zero brand visibility`,
        category: 'zero_visibility',
        metadata: {
          competitorMentions: totalCompetitorAppearances,
          competitorName: topCompetitor || undefined,
          brandMissing: true,
          appearanceRate: 0
        }
      });
    }
  }

  return suggestions;
};

/**
 * Find queries where competitors dominate but brand is present
 */
const findCompetitorGaps = (
  queryAnalysis: Map<string, QueryAnalysis>,
  brandName: string,
  competitors: string[]
): QuerySuggestion[] => {
  const suggestions: QuerySuggestion[] = [];

  for (const [query, analysis] of queryAnalysis) {
    if (analysis.brandAppearances === 0) continue; // Already handled in zero visibility

    // Find if any competitor appears more frequently than brand
    for (const [competitor, compCount] of Object.entries(analysis.competitorAppearances)) {
      if (compCount > analysis.brandAppearances) {
        const brandRate = (analysis.brandAppearances / analysis.totalRuns) * 100;
        const compRate = (compCount / analysis.totalRuns) * 100;
        const gap = compRate - brandRate;

        // Score: 60-80 based on gap size
        const score = 60 + Math.min(gap / 2, 20);

        suggestions.push({
          query,
          score,
          reason: `${competitor} appears ${compRate.toFixed(0)}% vs your ${brandRate.toFixed(0)}%`,
          category: 'competitor_gap',
          metadata: {
            competitorMentions: compCount,
            competitorName: competitor,
            brandMissing: false,
            avgPosition: Math.round(analysis.avgBrandPosition * 10) / 10,
            appearanceRate: Math.round(brandRate)
          }
        });
        break; // Only suggest once per query
      }
    }
  }

  return suggestions;
};

/**
 * Find high-performing queries that aren't tracked yet
 */
const findHighPotentialQueries = (
  queryAnalysis: Map<string, QueryAnalysis>,
  brandName: string
): QuerySuggestion[] => {
  const suggestions: QuerySuggestion[] = [];

  for (const [query, analysis] of queryAnalysis) {
    if (analysis.brandAppearances === 0) continue;

    const appearanceRate = (analysis.brandAppearances / analysis.totalRuns) * 100;

    // High potential if: appears frequently (>60%) and good position (<3)
    if (appearanceRate >= 60 && analysis.avgBrandPosition > 0 && analysis.avgBrandPosition <= 3) {
      // Score: 40-60 based on consistency and position
      const consistencyBonus = (appearanceRate - 60) / 4; // 0-10
      const positionBonus = (4 - analysis.avgBrandPosition) * 3.33; // 0-10
      const score = 40 + consistencyBonus + positionBonus;

      suggestions.push({
        query,
        score,
        reason: `Strong performer - ${appearanceRate.toFixed(0)}% appearance, avg #${analysis.avgBrandPosition.toFixed(1)} position`,
        category: 'high_performer',
        metadata: {
          brandMissing: false,
          avgPosition: Math.round(analysis.avgBrandPosition * 10) / 10,
          appearanceRate: Math.round(appearanceRate)
        }
      });
    }
  }

  return suggestions;
};

/**
 * Get the competitor with most appearances
 */
const getTopCompetitor = (competitorAppearances: Record<string, number>): string | null => {
  let top: { name: string; count: number } | null = null;

  for (const [name, count] of Object.entries(competitorAppearances)) {
    if (!top || count > top.count) {
      top = { name, count };
    }
  }

  return top?.name || null;
};

/**
 * Generate AI-powered query suggestions based on brand, competitors, and keywords
 */
const generateAIQuerySuggestions = async (
  brandName: string,
  keywords: string[],
  competitors: string[],
  excludeQueries: string[]
): Promise<QuerySuggestion[]> => {
  // If OpenAI is not available, fall back to keyword-based suggestions
  if (!openai) {
    logger.warn('OpenAI not configured, using keyword-based suggestions');
    return generateKeywordSuggestions(keywords, brandName);
  }

  try {
    const competitorStr = competitors.length > 0 ? competitors.join(', ') : 'other solutions';
    const keywordStr = keywords.length > 0 ? keywords.join(', ') : 'this space';

    const prompt = `You are an AI brand visibility analyst. Generate 10 diverse search queries that would cause AI models (like ChatGPT, Claude, Perplexity) to compare and recommend multiple brands in the "${keywordStr}" space.

Context:
- Brand to track: ${brandName}
- Competitors: ${competitorStr}
- Industry keywords: ${keywordStr}

CRITICAL RULE: **NEVER include "${brandName}" or any competitor names in the queries.** These queries measure ORGANIC visibility - whether ${brandName} appears naturally when users search generically. Including brand names in queries would bias the results.

Query Types to Generate:
1. Recommendation queries (e.g., "What's the best payment processor for SaaS startups?")
2. Generic comparison queries (e.g., "Top payment gateways for e-commerce in 2025")
3. Feature-based queries (e.g., "Which payment solution has the lowest transaction fees?")
4. Use-case specific queries (e.g., "Best payment processor for international transactions")
5. Buying decision queries (e.g., "Most reliable payment platform for startups")
6. Problem-solving queries (e.g., "What payment gateway should I use for subscriptions?")

AVOID:
- How-to questions (e.g., "How to integrate Stripe")
- Brand-specific questions (e.g., "What are Stripe's fees?", "Stripe vs PayPal")
- Technical implementation questions
- Queries that mention ${brandName} or competitor names

Requirements:
- Each query should be 5-15 words
- Should feel natural, like something a person would ask an AI assistant
- Must trigger AI to compare/recommend multiple brands naturally
- Mix of broad and specific queries
- Focus on problems, use cases, and features - NOT brand names
- Queries should measure organic visibility (whether brands appear without being prompted)

Return ONLY a JSON object with this structure:
{
  "queries": ["query 1", "query 2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8 // Higher temperature for more diverse suggestions
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    const queries = parsed.queries || [];

    if (!Array.isArray(queries) || queries.length === 0) {
      logger.warn('OpenAI returned invalid format, using keyword fallback');
      return generateKeywordSuggestions(keywords, brandName);
    }

    // Filter out queries that are already tracked or suggested
    const filteredQueries = queries.filter((q: string) =>
      !excludeQueries.some(excluded =>
        excluded.toLowerCase() === q.toLowerCase()
      )
    );

    // Convert to QuerySuggestion format
    const suggestions: QuerySuggestion[] = filteredQueries.map((query: string, idx: number) => ({
      query,
      score: 55 - idx * 2, // Descending scores from 55-37 (between data-driven and fallback)
      reason: 'AI-generated suggestion based on your brand and keywords',
      category: 'related' as const,
      metadata: {
        brandMissing: true,
        appearanceRate: 0
      }
    }));

    logger.info({
      generated: queries.length,
      filtered: filteredQueries.length,
      returned: suggestions.length
    }, 'AI query suggestions generated');

    return suggestions.slice(0, 10);

  } catch (error) {
    logger.error({ err: error }, 'Failed to generate AI suggestions, using keyword fallback');
    return generateKeywordSuggestions(keywords, brandName);
  }
};

/**
 * Generate keyword-based suggestions when no data exists
 */
const generateKeywordSuggestions = (
  keywords: string[],
  brandName: string
): QuerySuggestion[] => {
  if (keywords.length === 0) return [];

  const suggestions: QuerySuggestion[] = [];
  const keywordStr = keywords.slice(0, 3).join(', ');

  // Generate some common query patterns
  const templates = [
    `What are the best ${keywordStr} solutions?`,
    `Which ${keywordStr} tool should I choose?`,
    `How do I compare ${keywordStr} platforms?`,
    `What's the difference between ${keywordStr} providers?`,
    `Which ${keywordStr} service is most cost-effective?`
  ];

  templates.forEach((query, idx) => {
    suggestions.push({
      query,
      score: 50 - idx * 5, // Descending score
      reason: `Keyword-based suggestion - run first analysis to get data-driven suggestions`,
      category: 'related',
      metadata: {
        brandMissing: true,
        appearanceRate: 0
      }
    });
  });

  return suggestions;
};
