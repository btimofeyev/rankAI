import { useState } from 'react';
import Button from './Button.tsx';
import { QuerySuggestion } from '../types/api.ts';
import BulkTrackModal from './BulkTrackModal.tsx';

type QuerySuggestionsCardProps = {
  suggestions: QuerySuggestion[];
  onTrack: (query: string) => void;
  onBulkTrack: (queries: string[]) => void;
  loading?: boolean;
  trackedCount: number;
};

const getCategoryIcon = (category: QuerySuggestion['category']): string => {
  switch (category) {
    case 'zero_visibility':
      return '🎯';
    case 'competitor_gap':
      return '⚔️';
    case 'high_performer':
      return '⭐';
    case 'related':
      return '💡';
    default:
      return '📌';
  }
};

const QuerySuggestionsCard = ({ suggestions, onTrack, onBulkTrack, loading, trackedCount }: QuerySuggestionsCardProps) => {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const tone = (category: QuerySuggestion['category']): 'danger' | 'warning' | 'info' | 'neutral' => {
    switch (category) {
      case 'zero_visibility':
        return 'danger';
      case 'competitor_gap':
        return 'warning';
      case 'high_performer':
        return 'info';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return <div className="empty-state">Loading suggestions…</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-small">
        {trackedCount >= 20 ? 'All slots full (20/20) — remove queries to add more.' : 'Run more analyses to unlock tailored suggestions.'}
      </div>
    );
  }

  const displaySuggestions = collapsed ? suggestions.slice(0, 3) : suggestions.slice(0, 5);
  const hasMore = suggestions.length > 5;

  return (
    <>
      <div className="suggestions-card">
        <div className="section-heading">
          <span className="text-small">Suggested queries</span>
          {suggestions.length > 1 && trackedCount < 20 && (
            <Button type="button" variant="ghost" onClick={() => setShowBulkModal(true)}>
              Track multiple
            </Button>
          )}
        </div>

        <div className="suggestion-list">
          {displaySuggestions.map((suggestion) => (
            <div key={suggestion.query} className="suggestion-entry" data-tone={tone(suggestion.category)}>
              <div className="suggestion-entry__info">
                <div className="suggestion-entry__title">
                  {getCategoryIcon(suggestion.category)} {suggestion.query}
                </div>
                <div className="suggestion-entry__meta">{suggestion.reason} • Score: {suggestion.score}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onTrack(suggestion.query)}
                disabled={trackedCount >= 20}
              >
                Track
              </Button>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button type="button" variant="quiet" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? `Show ${suggestions.length - 3} more` : 'Show less'}
          </Button>
        )}

        {trackedCount >= 8 && (
          <div className="builder__alert">
            ⚠️ {trackedCount}/20 tracked — {20 - trackedCount} slots remaining
          </div>
        )}
      </div>

      {showBulkModal && (
        <BulkTrackModal
          suggestions={suggestions}
          trackedCount={trackedCount}
          onTrack={onBulkTrack}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </>
  );
};

export default QuerySuggestionsCard;
