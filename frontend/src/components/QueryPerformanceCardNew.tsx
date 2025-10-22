import Button from './Button.tsx';
import MiniSparkline from './MiniSparkline.tsx';
import { QueryPerformance } from '../types/api.ts';

type QueryPerformanceCardNewProps = {
  performance: QueryPerformance;
  brandName: string;
  competitors: string[];
  onRemove?: (query: string) => void;
  canRemove?: boolean;
  onViewDetails?: (query: string) => void;
};

const QueryPerformanceCardNew = ({
  performance,
  brandName,
  competitors,
  onRemove,
  canRemove = true,
  onViewDetails
}: QueryPerformanceCardNewProps) => {
  const isUnanalyzed = performance.totalAppearances === 0 && performance.appearanceRate === 0;
  const hasBrandData = performance.brandAppearances > 0;
  const trendData = performance.trendData ?? [];
  const latestTrend = trendData.at(-1) ?? 0;
  const previousTrend = trendData.length >= 2 ? trendData[trendData.length - 2] : 0;
  const trendDelta = latestTrend - previousTrend;

  const leadingCompetitor = Object.entries(performance.competitorData)
    .sort((a, b) => (b[1]?.appearances ?? 0) - (a[1]?.appearances ?? 0))[0] ?? null;

  const badge = () => {
    if (isUnanalyzed) return null;

    if (!hasBrandData) {
      const competitorMentioned = Object.values(performance.competitorData).some((item) => item.appearances > 0);
      if (competitorMentioned) {
        return <span className="query-card__badge" data-tone="danger">Competitors dominate</span>;
      }
      return <span className="query-card__badge" data-tone="warning">No visibility yet</span>;
    }

    if (performance.avgPosition <= 1) {
      return <span className="query-card__badge" data-tone="success">You own this query</span>;
    }

    if (performance.avgPosition > 3) {
      return <span className="query-card__badge" data-tone="warning">Improve positioning</span>;
    }

    return null;
  };

  return (
    <div className="query-card">
      <div className="query-card__header">
        <div className="stack stack--tight">
          <span className="query-card__title">{performance.query}</span>
          {performance.usedWebSearch && <span className="query-card__tag">Web</span>}
          {badge()}
        </div>
        {onRemove && canRemove && (
          <Button type="button" variant="quiet" onClick={() => onRemove(performance.query)}>
            Remove
          </Button>
        )}
      </div>

      {isUnanalyzed ? (
        <div className="card-empty query-card__empty">
          No runs yet. Add this query to a refresh to see performance.
        </div>
      ) : (
        <>
          {trendData.length > 0 && (
            <div className="query-card__trend">
              <MiniSparkline data={trendData} width={140} height={36} />
              <span className="text-small">
                {trendDelta >= 0 ? '+' : ''}{trendDelta} pts vs previous run
              </span>
            </div>
          )}

          <div className="query-card__metrics">
            <div>
              <div className="query-card__metric-label">Appearance rate</div>
              <div className="query-card__metric-value">{performance.appearanceRate}%</div>
            </div>
            <div>
              <div className="query-card__metric-label">Avg position</div>
              <div className="query-card__metric-value">{performance.avgPosition > 0 ? `#${performance.avgPosition}` : '—'}</div>
            </div>
            <div>
              <div className="query-card__metric-label">Brand mentions</div>
              <div className="query-card__metric-value">{performance.brandAppearances}</div>
            </div>
          </div>

          <div className="query-card__sentiment">
            <span className="chip chip--sentiment-positive">😊 {performance.sentiment.positive}</span>
            <span className="chip chip--sentiment-neutral">😐 {performance.sentiment.neutral}</span>
            <span className="chip chip--sentiment-negative">🙁 {performance.sentiment.negative}</span>
          </div>

          {leadingCompetitor && (
            <div className="query-card__competitor">
              <span>Top competitor:</span>
              <strong>{leadingCompetitor[0]}</strong>
              <span>({leadingCompetitor[1]?.appearances ?? 0} mentions)</span>
            </div>
          )}

          <div className="query-card__footer">
            <span>Total runs: {performance.totalAppearances}</span>
            <div className="builder__actions">
              {onViewDetails && (
                <Button type="button" variant="ghost" onClick={() => onViewDetails(performance.query)}>
                  View details
                </Button>
              )}
              {competitors.length > 0 && (
                <span className="text-small">Tracking vs {competitors.length} competitors</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QueryPerformanceCardNew;
