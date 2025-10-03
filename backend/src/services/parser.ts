import { VisibilityMention } from '../types.js';

const normalizeSentiment = (value: string): 'positive' | 'neutral' | 'negative' => {
  if (value === 'negative') return 'negative';
  if (value === 'positive') return 'positive';
  return 'neutral';
};

export const sanitizeMentions = (mentions: VisibilityMention[], brands: string[]): VisibilityMention[] => {
  const allowed = new Set(brands.map((brand) => brand.toLowerCase()));
  return mentions
    .filter((mention) => allowed.has(mention.brand.toLowerCase()))
    .map((mention) => ({
      ...mention,
      sentiment: normalizeSentiment(mention.sentiment)
    }));
};
