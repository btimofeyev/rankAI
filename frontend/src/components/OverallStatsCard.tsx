import { QueryPerformance } from '../types/api.ts';

type OverallStatsCardProps = {
  performance: QueryPerformance[];
  maxQueries: number;
};

const OverallStatsCard = ({ performance, maxQueries }: OverallStatsCardProps) => {
  // Filter out unanalyzed queries
  const analyzedPerf = performance.filter(p => p.totalAppearances > 0 || p.brandAppearances > 0);

  // Calculate aggregate stats
  const totalTracked = performance.length;
  const queriesWithMentions = analyzedPerf.filter(p => p.brandAppearances > 0).length;
  const totalAnalyzed = analyzedPerf.length;

  const avgAppearanceRate = analyzedPerf.length > 0
    ? Math.round(analyzedPerf.reduce((sum, p) => sum + p.appearanceRate, 0) / analyzedPerf.length)
    : 0;

  const positionsData = analyzedPerf
    .filter(p => p.avgPosition > 0)
    .map(p => p.avgPosition);

  const avgPosition = positionsData.length > 0
    ? Math.round((positionsData.reduce((sum, pos) => sum + pos, 0) / positionsData.length) * 10) / 10
    : 0;

  const totalSentiment = {
    positive: analyzedPerf.reduce((sum, p) => sum + p.sentiment.positive, 0),
    neutral: analyzedPerf.reduce((sum, p) => sum + p.sentiment.neutral, 0),
    negative: analyzedPerf.reduce((sum, p) => sum + p.sentiment.negative, 0)
  };

  const totalMentions = totalSentiment.positive + totalSentiment.neutral + totalSentiment.negative;

  const positivePercent = totalMentions > 0
    ? Math.round((totalSentiment.positive / totalMentions) * 100)
    : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(91, 140, 254, 0.1) 0%, rgba(91, 140, 254, 0.05) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(91, 140, 254, 0.2)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
            Overall Query Performance
          </h3>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
            Aggregate statistics across all tracked queries
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: 'rgba(91, 140, 254, 0.15)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--accent)'
        }}>
          {totalTracked}/{maxQueries} queries tracked
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {/* Queries with Mentions */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Coverage
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
            {queriesWithMentions}/{totalAnalyzed}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            {totalAnalyzed > 0 ? Math.round((queriesWithMentions / totalAnalyzed) * 100) : 0}% of analyzed queries
          </div>
        </div>

        {/* Average Appearance Rate */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Appearance
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: 'var(--accent)' }}>
            {avgAppearanceRate}%
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            Across all queries
          </div>
        </div>

        {/* Average Position */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Position
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
            {avgPosition > 0 ? `#${avgPosition}` : '-'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            When mentioned
          </div>
        </div>

        {/* Overall Sentiment */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sentiment
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: 'var(--success)' }}>
            {positivePercent}%
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6, display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--success)' }}>✓ {totalSentiment.positive}</span>
            <span>○ {totalSentiment.neutral}</span>
            <span style={{ color: 'var(--danger)' }}>✗ {totalSentiment.negative}</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {totalAnalyzed === 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(91, 140, 254, 0.1)',
          border: '1px solid rgba(91, 140, 254, 0.2)',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          📊 Run your first analysis to see aggregate statistics
        </div>
      )}
    </div>
  );
};

export default OverallStatsCard;
