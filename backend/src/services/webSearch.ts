import OpenAI from 'openai';
import { env } from '../config/env.js';
import { Citation } from '../types.js';
import { logger } from '../utils/logger.js';

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

type WebSearchResponse = {
  responseText: string;
  citations: Citation[];
  usedWebSearch: boolean;
};

/**
 * Performs a query with web search enabled using OpenAI Responses API
 */
export const queryWithWebSearch = async (query: string): Promise<WebSearchResponse> => {
  if (!openai) {
    logger.warn('OPENAI_API_KEY missing, cannot use web search');
    return {
      responseText: '',
      citations: [],
      usedWebSearch: false
    };
  }

  try {
    // Use the Responses API with web_search tool
    // Note: The OpenAI SDK may not have full TypeScript support for Responses API yet
    // We'll use a workaround by calling it through the client

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

    if (!response.ok) {
      const error = await response.text();
      logger.error({ error, status: response.status }, 'Responses API call failed');
      throw new Error(`Responses API failed: ${response.status}`);
    }

    const data: any = await response.json();

    // Parse the response
    const output = data.output || [];
    let responseText = '';
    const citations: Citation[] = [];
    let usedWebSearch = false;

    // Look for web_search_call to confirm search was used
    const webSearchCall = output.find((item: any) => item.type === 'web_search_call');
    if (webSearchCall) {
      usedWebSearch = true;
      logger.info({ query, callId: webSearchCall.id }, 'Web search performed');
    }

    // Find the message output with content
    const messageOutput = output.find((item: any) => item.type === 'message');
    if (messageOutput && messageOutput.content) {
      const contentItem = messageOutput.content[0];
      if (contentItem && contentItem.type === 'output_text') {
        responseText = contentItem.text || '';

        // Extract citations from annotations
        if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
          for (const annotation of contentItem.annotations) {
            if (annotation.type === 'url_citation' && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || extractDomain(annotation.url),
                domain: extractDomain(annotation.url),
                snippet: extractSnippet(responseText, annotation.start_index, annotation.end_index)
              });
            }
          }
        }
      }
    }

    logger.info({
      query,
      citationsFound: citations.length,
      responseLength: responseText.length,
      usedWebSearch
    }, 'Web search query completed');

    return {
      responseText,
      citations,
      usedWebSearch
    };

  } catch (error) {
    logger.error({ err: error, query }, 'Failed to perform web search');
    // Fallback to regular query without web search
    return {
      responseText: '',
      citations: [],
      usedWebSearch: false
    };
  }
};

/**
 * Performs a query without web search (fallback)
 */
export const queryWithoutWebSearch = async (query: string): Promise<WebSearchResponse> => {
  if (!openai) {
    return {
      responseText: '',
      citations: [],
      usedWebSearch: false
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: env.openaiModel,
      messages: [
        {
          role: 'user',
          content: query
        }
      ]
    });

    const responseText = response.choices[0]?.message?.content ?? '';

    return {
      responseText,
      citations: [],
      usedWebSearch: false
    };

  } catch (error) {
    logger.error({ err: error, query }, 'Failed to perform standard query');
    return {
      responseText: '',
      citations: [],
      usedWebSearch: false
    };
  }
};

/**
 * Extract domain from URL
 */
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

/**
 * Extract snippet from response text using annotation indices
 */
const extractSnippet = (text: string, startIndex: number, endIndex: number): string => {
  if (!text || startIndex === undefined || endIndex === undefined) {
    return '';
  }

  const snippet = text.slice(startIndex, endIndex);
  return snippet.length > 200 ? snippet.slice(0, 200) + '...' : snippet;
};
