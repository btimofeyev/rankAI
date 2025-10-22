import { useQuery } from '@tanstack/react-query';
import { fetchQueryTrends } from '../api/index.ts';
import { useSession } from '../hooks/useSession.tsx';
import QueryTrendChart from './QueryTrendChart.tsx';

type QueryDetailModalProps = {
  projectId: string;
  queryText: string;
  brandName: string;
  competitors: string[];
  onClose: () => void;
};

const QueryDetailModal = ({ projectId, queryText, brandName, competitors, onClose }: QueryDetailModalProps) => {
  const { session } = useSession();
  const token = session?.access_token ?? null;

  const trendsQuery = useQuery({
    queryKey: ['query-trends', projectId, queryText],
    queryFn: () => fetchQueryTrends(token ?? '', projectId, queryText),
    enabled: Boolean(token)
  });

  const trends = trendsQuery.data?.trends;
  const stats = trends?.overallStats;

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'var(--success)';
    if (sentiment === 'negative') return 'var(--danger)';
    return 'rgba(255,255,255,0.6)';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return '↗️';
    if (direction === 'down') return '↘️';
    return '→';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
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
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{queryText}</h2>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>Detailed performance analysis</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 600
            }}
          >
            ×
          </button>
        </div>

        {trendsQuery.isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
            Loading trend data...
          </div>
        ) : !trends ? (
          <div style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
            No trend data available
          </div>
        ) : (
          <div>
            {/* Overall Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(91, 140, 254, 0.08)',
                border: '1px solid rgba(91, 140, 254, 0.2)'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Appearance Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent)' }}>
                  {stats?.appearanceRate}%
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                  {stats?.appearanceCount}/{stats?.totalRuns} runs
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Avg Position</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>
                  {stats?.avgPosition && stats.avgPosition > 0 ? `#${stats.avgPosition}` : '-'}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                  Best: {stats?.bestPosition ? `#${stats.bestPosition}` : '-'}
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Trend</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>
                  {getTrendIcon(stats?.trendDirection || 'stable')}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', textTransform: 'capitalize' }}>
                  {stats?.trendDirection}
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Sentiment</div>
                <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span style={{ color: getSentimentColor('positive') }}>
                    ✓ {stats?.sentimentBreakdown.positive || 0}
                  </span>
                  <span style={{ color: getSentimentColor('neutral') }}>
                    ○ {stats?.sentimentBreakdown.neutral || 0}
                  </span>
                  <span style={{ color: getSentimentColor('negative') }}>
                    ✗ {stats?.sentimentBreakdown.negative || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '24px'
            }}>
              <QueryTrendChart
                dataPoints={trends.dataPoints}
                brandName={brandName}
                competitors={competitors}
              />
            </div>

            {/* Competitor Comparison */}
            {Object.keys(trends.competitorComparison).length > 0 && (
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
                  Competitor Comparison
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {Object.entries(trends.competitorComparison).map(([comp, data]) => (
                    <div
                      key={comp}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{comp}</div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                        <div>
                          <span style={{ opacity: 0.6 }}>Appearances: </span>
                          <span style={{ fontWeight: 600 }}>{data.appearanceCount}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.6 }}>Avg Position: </span>
                          <span style={{ fontWeight: 600 }}>
                            {data.avgPosition > 0 ? `#${data.avgPosition}` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryDetailModal;
