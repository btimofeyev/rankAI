import { QueryPerformance } from '../types/api.ts';

type TopQueriesCardProps = {
  performance: QueryPerformance[];
  onTrack: (query: string) => void;
  onUntrack: (query: string) => void;
  loading?: boolean;
};

const TopQueriesCard = ({ performance, onTrack, onUntrack, loading }: TopQueriesCardProps) => {
  const topPerformers = performance.slice(0, 5);

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>
          Top Performing Queries
        </h3>
        <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (topPerformers.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>
          Top Performing Queries
        </h3>
        <div style={{ opacity: 0.6, fontSize: '14px' }}>
          Run an analysis to see your top queries
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>
        Top Performing Queries
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topPerformers.map((perf, idx) => (
          <div
            key={perf.query}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: perf.isTracked ? 'rgba(91, 140, 254, 0.08)' : 'rgba(255,255,255,0.03)',
              border: perf.isTracked ? '1px solid rgba(91, 140, 254, 0.2)' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {perf.isTracked && <span style={{ fontSize: '14px' }}>📌</span>}
                <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>
                  {perf.query.length > 70 ? perf.query.substring(0, 70) + '...' : perf.query}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', opacity: 0.7 }}>
                <span>{perf.brandAppearances} mentions</span>
                <span>•</span>
                <span>{perf.appearanceRate}% rate</span>
                {perf.avgPosition > 0 && (
                  <>
                    <span>•</span>
                    <span>Avg #{ perf.avgPosition}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => perf.isTracked ? onUntrack(perf.query) : onTrack(perf.query)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: perf.isTracked ? '1px solid rgba(255,107,107,0.3)' : '1px solid rgba(91, 140, 254, 0.3)',
                background: 'transparent',
                color: perf.isTracked ? 'var(--danger)' : 'var(--accent)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {perf.isTracked ? 'Untrack' : '📌 Track'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopQueriesCard;
