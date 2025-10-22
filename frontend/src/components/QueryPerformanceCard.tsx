import { useState } from 'react';
import { QueryPerformance } from '../types/api.ts';

type QueryPerformanceCardProps = {
  performance: QueryPerformance;
  onRemove?: (query: string) => void;
  canRemove?: boolean;
  onViewDetails?: (query: string) => void;
};

const QueryPerformanceCard = ({ performance, onRemove, canRemove = true, onViewDetails }: QueryPerformanceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'var(--success)';
    if (sentiment === 'negative') return 'var(--danger)';
    return 'rgba(255,255,255,0.6)';
  };

  const totalSentiment = performance.sentiment.positive + performance.sentiment.neutral + performance.sentiment.negative;
  const hasData = performance.brandAppearances > 0;
  const isUnanalyzed = performance.totalAppearances === 0 && performance.appearanceRate === 0;

  return (
    <div
      style={{
        position: 'relative',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Remove Button (on hover) */}
      {onRemove && canRemove && isHovered && (
        <button
          onClick={() => onRemove(performance.query)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255,107,107,0.2)',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            zIndex: 10
          }}
          title={canRemove ? 'Remove query' : 'Cannot remove last query'}
        >
          × Remove
        </button>
      )}

      {/* Query Text */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', paddingRight: isHovered && onRemove ? '80px' : '0' }}>
          <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>
            {performance.query}
          </div>
          {performance.usedWebSearch && (
            <span style={{
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(91, 140, 254, 0.15)',
              color: 'var(--accent)',
              fontSize: '10px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}>
              🌐 WEB
            </span>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {isUnanalyzed ? (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          background: 'rgba(91, 140, 254, 0.08)',
          border: '1px solid rgba(91, 140, 254, 0.2)',
          fontSize: '13px',
          color: 'var(--accent)',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          📊 Not analyzed yet - run analysis to see data
        </div>
      ) : hasData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Appearance Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent)' }}>
              {performance.appearanceRate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Avg Position</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {performance.avgPosition > 0 ? `#${performance.avgPosition}` : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Mentions</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {performance.brandAppearances}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.2)',
          fontSize: '12px',
          color: 'var(--danger)',
          marginBottom: '12px'
        }}>
          ⚠️ No brand mentions found in analyzed runs
        </div>
      )}

      {/* Sentiment Bar */}
      {totalSentiment > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '6px' }}>Sentiment</div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            {performance.sentiment.positive > 0 && (
              <div
                style={{
                  flex: performance.sentiment.positive,
                  background: getSentimentColor('positive')
                }}
                title={`${performance.sentiment.positive} positive`}
              />
            )}
            {performance.sentiment.neutral > 0 && (
              <div
                style={{
                  flex: performance.sentiment.neutral,
                  background: getSentimentColor('neutral')
                }}
                title={`${performance.sentiment.neutral} neutral`}
              />
            )}
            {performance.sentiment.negative > 0 && (
              <div
                style={{
                  flex: performance.sentiment.negative,
                  background: getSentimentColor('negative')
                }}
                title={`${performance.sentiment.negative} negative`}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', opacity: 0.7 }}>
            <span style={{ color: getSentimentColor('positive') }}>✓ {performance.sentiment.positive}</span>
            <span style={{ color: getSentimentColor('neutral') }}>○ {performance.sentiment.neutral}</span>
            <span style={{ color: getSentimentColor('negative') }}>✗ {performance.sentiment.negative}</span>
          </div>
        </div>
      )}

      {/* Citations */}
      {performance.citations && performance.citations.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '6px' }}>
            🌐 {performance.citations.length} source{performance.citations.length !== 1 ? 's' : ''} from web search
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {performance.citations.slice(0, 3).map((citation, idx) => (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(91, 140, 254, 0.1)',
                  border: '1px solid rgba(91, 140, 254, 0.2)',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}
              >
                {citation.domain}
              </a>
            ))}
            {performance.citations.length > 3 && (
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                opacity: 0.6
              }}>
                +{performance.citations.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Details Button (for analyzed queries) */}
      {!isUnanalyzed && onViewDetails && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => onViewDetails(performance.query)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(91, 140, 254, 0.3)',
              background: 'rgba(91, 140, 254, 0.08)',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91, 140, 254, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(91, 140, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(91, 140, 254, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(91, 140, 254, 0.3)';
            }}
          >
            📊 View Detailed Analytics
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryPerformanceCard;
