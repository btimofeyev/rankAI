import { useState, useEffect } from 'react';
import { QuerySuggestion } from '../types/api.ts';

type BulkTrackModalProps = {
  suggestions: QuerySuggestion[];
  trackedCount: number;
  onTrack: (queries: string[]) => void;
  onClose: () => void;
};

const BulkTrackModal = ({ suggestions, trackedCount, onTrack, onClose }: BulkTrackModalProps) => {
  const maxSlots = 10;
  const availableSlots = maxSlots - trackedCount;

  const [selectedQueries, setSelectedQueries] = useState<Set<string>>(new Set());
  const [isTracking, setIsTracking] = useState(false);

  // Group suggestions by category
  const groupedSuggestions = {
    zero_visibility: suggestions.filter(s => s.category === 'zero_visibility'),
    competitor_gap: suggestions.filter(s => s.category === 'competitor_gap'),
    high_performer: suggestions.filter(s => s.category === 'high_performer'),
    related: suggestions.filter(s => s.category === 'related')
  };

  const categoryLabels = {
    zero_visibility: '🎯 Critical Gaps',
    competitor_gap: '⚔️ Competitive Gaps',
    high_performer: '⭐ High Performers',
    related: '💡 Related Queries'
  };

  const toggleQuery = (query: string) => {
    const newSelected = new Set(selectedQueries);
    if (newSelected.has(query)) {
      newSelected.delete(query);
    } else {
      if (newSelected.size < availableSlots) {
        newSelected.add(query);
      }
    }
    setSelectedQueries(newSelected);
  };

  const selectCategory = (category: keyof typeof groupedSuggestions) => {
    const categoryQueries = groupedSuggestions[category].map(s => s.query);
    const newSelected = new Set(selectedQueries);

    categoryQueries.forEach(query => {
      if (newSelected.size < availableSlots && !newSelected.has(query)) {
        newSelected.add(query);
      }
    });

    setSelectedQueries(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set<string>();
    suggestions.slice(0, availableSlots).forEach(s => newSelected.add(s.query));
    setSelectedQueries(newSelected);
  };

  const clearAll = () => {
    setSelectedQueries(new Set());
  };

  const handleTrack = async () => {
    setIsTracking(true);
    await onTrack(Array.from(selectedQueries));
    setIsTracking(false);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#111827'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Track Multiple Queries</h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                Select up to {availableSlots} queries to track ({trackedCount}/10 currently tracked)
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '20px',
                opacity: 0.6
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={selectAll}
              disabled={availableSlots === 0}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(91, 140, 254, 0.3)',
                background: 'rgba(91, 140, 254, 0.08)',
                color: availableSlots === 0 ? 'rgba(255,255,255,0.3)' : 'var(--accent)',
                cursor: availableSlots === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Select Top {Math.min(availableSlots, suggestions.length)}
            </button>
            <button
              onClick={clearAll}
              disabled={selectedQueries.size === 0}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'inherit',
                cursor: selectedQueries.size === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: selectedQueries.size === 0 ? 0.3 : 0.7
              }}
            >
              Clear All
            </button>
            {Object.entries(groupedSuggestions).map(([category, queries]) => {
              if (queries.length === 0) return null;
              return (
                <button
                  key={category}
                  onClick={() => selectCategory(category as keyof typeof groupedSuggestions)}
                  disabled={availableSlots === 0}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: availableSlots === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: availableSlots === 0 ? 0.3 : 0.7
                  }}
                >
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {Object.entries(groupedSuggestions).map(([category, queries]) => {
            if (queries.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {queries.map((suggestion) => {
                    const isSelected = selectedQueries.has(suggestion.query);
                    const isDisabled = !isSelected && selectedQueries.size >= availableSlots;

                    return (
                      <label
                        key={suggestion.query}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(91, 140, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid rgba(91, 140, 254, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.5 : 1,
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleQuery(suggestion.query)}
                          disabled={isDisabled}
                          style={{
                            marginTop: '2px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', lineHeight: 1.3 }}>
                            {suggestion.query}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.7, lineHeight: 1.4 }}>
                            {suggestion.reason}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>
            {selectedQueries.size} selected
            {selectedQueries.size >= availableSlots && availableSlots > 0 && (
              <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>
                (max {availableSlots})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleTrack}
              disabled={selectedQueries.size === 0 || isTracking}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: selectedQueries.size === 0 ? 'rgba(91, 140, 254, 0.3)' : 'var(--accent)',
                color: selectedQueries.size === 0 ? 'rgba(255,255,255,0.5)' : '#0b0d11',
                cursor: selectedQueries.size === 0 || isTracking ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {isTracking ? 'Tracking...' : `Track ${selectedQueries.size} ${selectedQueries.size === 1 ? 'Query' : 'Queries'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTrackModal;
