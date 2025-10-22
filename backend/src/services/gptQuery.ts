import OpenAI from 'openai';
import { env } from '../config/env.js';
import { VisibilityMention, Citation } from '../types.js';
import { logger } from '../utils/logger.js';
import { queryWithWebSearch, queryWithoutWebSearch } from './webSearch.js';

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

const generateIndustryQueries = async (keywords: string[], count: number): Promise<string[]> => {
  if (!openai) {
    logger.warn('OPENAI_API_KEY missing, returning default queries');
    return [
      'What are the best solutions in this space?',
      'Which tools are most popular?',
      'How do I choose the right platform?'
    ].slice(0, count);
  }

  const keywordString = keywords.join(', ');
  const prompt = `Generate ${count} diverse search queries that people ask when looking for solutions in the "${keywordString}" space. These should be natural questions someone would ask when researching tools/services, WITHOUT mentioning specific brand names. Focus on problems, comparisons, features, and recommendations. Return ONLY a JSON array of strings, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    // Handle different possible JSON structures
    const queries = parsed.queries || parsed.questions || parsed.results || Object.values(parsed)[0];

    if (Array.isArray(queries) && queries.length > 0) {
      logger.info({ count: queries.length }, 'Generated industry queries');
      return queries.slice(0, count);
    }

    throw new Error('No valid queries in response');
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate queries, using fallback');
    return [
      `What are the best ${keywordString} solutions?`,
      `Which ${keywordString} tool should I use?`,
      `How do I compare ${keywordString} platforms?`
    ].slice(0, count);
  }
};

type GPTMention = {
  brand: string;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
};

type GPTResponse = {
  query: string;
  mentions: GPTMention[];
};

const mockMentions = (query: string, brand: string, competitors: string[]): VisibilityMention[] => {
  const actors = [brand, ...competitors];
  return actors.map((actor, index) => ({
    query,
    brand: actor,
    position: index + 1,
    sentiment: actor === brand ? 'positive' : index % 2 === 0 ? 'neutral' : 'positive',
    context: `${actor} mentioned in synthetic result for ${query}`
  }));
};

const responseSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          mentions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                brand: { type: 'string' },
                position: { type: 'integer' },
                sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                context: { type: 'string' }
              },
              required: ['brand', 'position', 'sentiment', 'context'],
              additionalProperties: false
            }
          }
        },
        required: ['query', 'mentions'],
        additionalProperties: false
      }
    }
  },
  required: ['results'],
  additionalProperties: false
} as const;

const analyzeResponseForMentions = (
  query: string,
  responseText: string,
  brands: string[]
): VisibilityMention[] => {
  const mentions: VisibilityMention[] = [];
  const lowerResponse = responseText.toLowerCase();

  for (const brand of brands) {
    const lowerBrand = brand.toLowerCase();
    const regex = new RegExp(`\\b${lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = responseText.match(regex);

    if (matches && matches.length > 0) {
      // Find first occurrence position in the text
      const firstIndex = lowerResponse.indexOf(lowerBrand);
      const position = mentions.length + 1;

      // Extract context around the mention
      const contextStart = Math.max(0, firstIndex - 50);
      const contextEnd = Math.min(responseText.length, firstIndex + lowerBrand.length + 50);
      const context = responseText.slice(contextStart, contextEnd).trim();

      // Simple sentiment detection
      const sentimentKeywords = {
        positive: ['best', 'top', 'great', 'excellent', 'leading', 'popular', 'recommended'],
        negative: ['worst', 'poor', 'avoid', 'limited', 'lacking']
      };

      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      const surroundingText = responseText.slice(Math.max(0, firstIndex - 100), Math.min(responseText.length, firstIndex + 100)).toLowerCase();

      if (sentimentKeywords.positive.some(word => surroundingText.includes(word))) {
        sentiment = 'positive';
      } else if (sentimentKeywords.negative.some(word => surroundingText.includes(word))) {
        sentiment = 'negative';
      }

      mentions.push({
        query,
        brand,
        position,
        sentiment,
        context
      });
    }
  }

  return mentions;
};

export type QueryAnalysisResult = {
  query: string;
  responseText: string;
  mentions: VisibilityMention[];
  citations?: Citation[];
  usedWebSearch?: boolean;
};

export const runBrandVisibilityAnalysis = async (
  brand: string,
  keywords: string[],
  competitors: string[],
  trackedQueries: string[] = []
): Promise<QueryAnalysisResult[]> => {
  if (!openai) {
    logger.warn('OPENAI_API_KEY missing, returning mock GPT data');
    const mockQueries = ['query1', 'query2', 'query3'];
    return mockQueries.map((query) => ({
      query,
      responseText: `Mock response for ${query}`,
      mentions: mockMentions(query, brand, competitors)
    }));
  }

  try {
    // Use only the tracked queries (no more random generation)
    const queries = trackedQueries;

    if (queries.length === 0) {
      logger.warn({ brand }, 'No queries to analyze');
      return [];
    }

    logger.info({
      totalQueries: queries.length,
      brand,
      keywords
    }, 'Starting analysis with defined queries');

    const brands = [brand, ...competitors];
    const results: QueryAnalysisResult[] = [];

    // Step 2: Run queries through GPT-5 in parallel batches
    const BATCH_SIZE = 5; // Process 5 queries concurrently
    const batches: string[][] = [];
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      batches.push(queries.slice(i, i + BATCH_SIZE));
    }

    logger.info({ totalBatches: batches.length, batchSize: BATCH_SIZE }, 'Starting parallel query processing');

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      logger.info({ batchIndex: batchIndex + 1, batchQueries: batch.length }, 'Processing batch');

      const batchPromises = batch.map(async (query) => {
        try {
          // Use web search if enabled, otherwise fallback to standard query
          const searchResult = env.useWebSearch
            ? await queryWithWebSearch(query)
            : await queryWithoutWebSearch(query);

          const { responseText, citations, usedWebSearch } = searchResult;

          if (responseText) {
            const mentions = analyzeResponseForMentions(query, responseText, brands);
            logger.info({
              query,
              mentionsFound: mentions.length,
              brands: mentions.map(m => m.brand),
              citationsFound: citations?.length || 0,
              usedWebSearch
            }, 'Query analyzed');
            return {
              query,
              responseText,
              mentions,
              citations,
              usedWebSearch
            };
          } else {
            logger.info({ query, usedWebSearch }, 'Query analyzed - no response text');
            return {
              query,
              responseText: '',
              mentions: [],
              citations,
              usedWebSearch
            };
          }
        } catch (queryError) {
          logger.error({ err: queryError, query }, 'Failed to analyze query');
          return {
            query,
            responseText: '',
            mentions: [],
            citations: [],
            usedWebSearch: false
          };
        }
      });

      // Wait for all queries in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const totalMentions = results.reduce((sum, r) => sum + r.mentions.length, 0);
    const queriesWithMentions = results.filter(r => r.mentions.length > 0).length;

    logger.info({
      totalQueries: results.length,
      queriesWithMentions,
      totalMentions,
      uniqueQueriesWithMentions: new Set(results.filter(r => r.mentions.length > 0).map(r => r.query)).size
    }, 'Analysis complete');

    return results;
  } catch (error) {
    logger.error({ err: error }, 'Failed to run brand visibility analysis, falling back to mock data');
    const fallbackQueries = ['fallback query 1', 'fallback query 2', 'fallback query 3'];
    return fallbackQueries.map((query) => ({
      query,
      responseText: `Fallback response for ${query}`,
      mentions: mockMentions(query, brand, competitors)
    }));
  }
};
