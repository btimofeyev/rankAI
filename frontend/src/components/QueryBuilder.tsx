import { useState } from 'react';
import Button from './Button.tsx';
import { QuerySuggestion } from '../types/api.ts';

type QueryBuilderProps = {
  queries: string[];
  onQueriesChange: (queries: string[]) => void;
  suggestions?: QuerySuggestion[];
  onLoadSuggestions?: () => void;
  loadingSuggestions?: boolean;
  maxQueries?: number;
};

const QueryBuilder = ({
  queries,
  onQueriesChange,
  suggestions = [],
  onLoadSuggestions,
  loadingSuggestions = false,
  maxQueries = 20
}: QueryBuilderProps) => {
  const [newQuery, setNewQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddQuery = () => {
    const trimmed = newQuery.trim();
    if (!trimmed) return;
    if (queries.includes(trimmed)) {
      alert('This query is already added');
      return;
    }
    if (queries.length >= maxQueries) {
      alert(`Maximum ${maxQueries} queries allowed`);
      return;
    }

    onQueriesChange([...queries, trimmed]);
    setNewQuery('');
  };

  const handleRemoveQuery = (index: number) => {
    onQueriesChange(queries.filter((_, i) => i !== index));
  };

  const handleAddSuggestion = (suggestion: QuerySuggestion) => {
    if (queries.includes(suggestion.query)) {
      alert('This query is already added');
      return;
    }
    if (queries.length >= maxQueries) {
      alert(`Maximum ${maxQueries} queries allowed`);
      return;
    }

    onQueriesChange([...queries, suggestion.query]);
  };

  const handleLoadSuggestions = () => {
    if (onLoadSuggestions) {
      onLoadSuggestions();
      setShowSuggestions(true);
    }
  };

  const suggestionTone = (category: QuerySuggestion['category']): 'danger' | 'warning' | 'info' | 'neutral' => {
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

  return (
    <div className="builder">
      <div className="builder__controls">
        <div className="section-heading">
          <span className="text-small">
            Queries to track {queries.length > 0 && `(${queries.length}/${maxQueries})`}
          </span>
          {onLoadSuggestions && (
            <Button type="button" variant="ghost" onClick={handleLoadSuggestions} disabled={loadingSuggestions}>
              {loadingSuggestions ? 'Loading…' : 'Get suggestions'}
            </Button>
          )}
        </div>
        <div className="builder__actions">
          <input
            type="text"
            value={newQuery}
            onChange={(event) => setNewQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddQuery();
              }
            }}
            placeholder="e.g., best AI tutor for high school"
            className="field__input"
          />
          <Button
            type="button"
            onClick={handleAddQuery}
            disabled={!newQuery.trim() || queries.length >= maxQueries}
          >
            + Add
          </Button>
        </div>
        <span className="text-small">
          Add 1-{maxQueries} prompts that matter most. We monitor them in every run.
        </span>
      </div>

      {queries.length > 0 && (
        <div className="builder__current">
          <span className="text-small">Your queries ({queries.length})</span>
          <div className="builder__list">
            {queries.map((query, index) => (
              <div key={query} className="builder__item">
                <span className="builder__item-text">{index + 1}. {query}</span>
                <Button type="button" variant="quiet" onClick={() => handleRemoveQuery(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-card">
          <div className="section-heading">
            <span className="text-small">Suggested queries</span>
            <Button type="button" variant="quiet" onClick={() => setShowSuggestions(false)}>
              Hide
            </Button>
          </div>
          <div className="suggestion-list">
            {suggestions.slice(0, 10).map((suggestion) => {
              const isAdded = queries.includes(suggestion.query);
              return (
                <div key={suggestion.query} className="suggestion-entry" data-tone={suggestionTone(suggestion.category)}>
                  <div className="suggestion-entry__info">
                    <span className="suggestion-entry__title">{suggestion.query}</span>
                    <span className="suggestion-entry__meta">
                      {suggestion.reason} • Score: {suggestion.score}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleAddSuggestion(suggestion)}
                    disabled={isAdded || queries.length >= maxQueries}
                  >
                    {isAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {queries.length === 0 && (
        <div className="builder__alert">
          ⚠️ Add at least 1 query to track
        </div>
      )}
    </div>
  );
};

export default QueryBuilder;
