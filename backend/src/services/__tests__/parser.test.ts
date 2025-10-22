import { describe, it, expect } from 'vitest';
import { sanitizeMentions } from '../parser.js';

describe('sanitizeMentions', () => {
  it('removes brands outside of allow list and normalizes sentiment', () => {
    const result = sanitizeMentions([
      { query: 'q1', brand: 'Klio AI', position: 1, sentiment: 'positive' as const, context: 'A' },
      { query: 'q1', brand: 'Unknown', position: 2, sentiment: 'positive' as const, context: 'B' }
    ], ['Klio AI']);
    expect(result).toHaveLength(1);
    expect(result[0]?.sentiment).toBe('positive');
  });
});
