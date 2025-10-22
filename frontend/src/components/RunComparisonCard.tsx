type RunStats = {
  queriesMentioned: number;
  totalQueries: number;
  appearanceRate: number;
  avgPosition: number | null;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

type RunComparisonCardProps = {
  currentRun: RunStats;
  lastRun?: RunStats;
  lifetimeStats?: RunStats;
};

function StatDelta({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === null) {
    return <span className="stat-delta stat-new">New!</span>;
  }

  const delta = current - previous;
  if (Math.abs(delta) < 0.5) {
    return <span className="stat-delta stat-stable">→</span>;
  }

  const trend = delta > 0 ? 'up' : 'down';
  const sign = delta > 0 ? '+' : '';

  return (
    <span className={`stat-delta stat-${trend}`}>
      {trend === 'up' ? '↑' : '↓'} {sign}{delta.toFixed(1)}
    </span>
  );
}

function PositionDelta({ current, previous }: { current: number | null; previous?: number | null }) {
  if (current === null) {
    return <span className="stat-value-empty">N/A</span>;
  }

  if (previous === undefined || previous === null) {
    return (
      <span>
        #{current.toFixed(1)} <span className="stat-delta stat-new">New!</span>
      </span>
    );
  }

  const delta = previous - current; // Lower is better for position
  if (Math.abs(delta) < 0.1) {
    return (
      <span>
        #{current.toFixed(1)} <span className="stat-delta stat-stable">→</span>
      </span>
    );
  }

  const trend = delta > 0 ? 'up' : 'down'; // Improved if delta > 0 (went from #3 to #1)

  return (
    <span>
      #{current.toFixed(1)} <span className={`stat-delta stat-${trend}`}>
        {trend === 'up' ? '↑' : '↓'}
      </span>
    </span>
  );
}

function SentimentBar({ sentiment }: { sentiment: RunStats['sentiment'] }) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  if (total === 0) return <span className="no-data">-</span>;

  const positivePct = (sentiment.positive / total) * 100;
  const neutralPct = (sentiment.neutral / total) * 100;
  const negativePct = (sentiment.negative / total) * 100;

  return (
    <div className="sentiment-bar-container">
      <div className="sentiment-bar">
        {positivePct > 0 && (
          <div
            className="sentiment-bar-segment sentiment-positive"
            style={{ width: `${positivePct}%` }}
            title={`${sentiment.positive} positive`}
          />
        )}
        {neutralPct > 0 && (
          <div
            className="sentiment-bar-segment sentiment-neutral"
            style={{ width: `${neutralPct}%` }}
            title={`${sentiment.neutral} neutral`}
          />
        )}
        {negativePct > 0 && (
          <div
            className="sentiment-bar-segment sentiment-negative"
            style={{ width: `${negativePct}%` }}
            title={`${sentiment.negative} negative`}
          />
        )}
      </div>
      <div className="sentiment-labels">
        <span className="sentiment-label-positive">[POS] {positivePct.toFixed(0)}%</span>
        <span className="sentiment-label-neutral">[NEU] {neutralPct.toFixed(0)}%</span>
        <span className="sentiment-label-negative">[NEG] {negativePct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function RunComparisonCard({ currentRun, lastRun, lifetimeStats }: RunComparisonCardProps) {
  return (
    <div className="run-comparison-card">
      <h3>TREND ANALYSIS</h3>

      <div className="run-comparison-grid">
        <div className="run-comparison-col">
          <div className="run-comparison-header">This Run</div>
          <div className="run-stat">
            <div className="run-stat-label">Queries</div>
            <div className="run-stat-value">
              {currentRun.queriesMentioned}/{currentRun.totalQueries}
            </div>
          </div>
          <div className="run-stat">
            <div className="run-stat-label">Appear Rate</div>
            <div className="run-stat-value">
              {currentRun.appearanceRate.toFixed(0)}%
            </div>
          </div>
          <div className="run-stat">
            <div className="run-stat-label">Avg Position</div>
            <div className="run-stat-value">
              {currentRun.avgPosition !== null ? `#${currentRun.avgPosition.toFixed(1)}` : 'N/A'}
            </div>
          </div>
          <div className="run-stat">
            <div className="run-stat-label">Sentiment</div>
            <div className="run-stat-value">
              <SentimentBar sentiment={currentRun.sentiment} />
            </div>
          </div>
        </div>

        <div className="run-comparison-col">
          <div className="run-comparison-header">Last Run</div>
          {lastRun ? (
            <>
              <div className="run-stat">
                <div className="run-stat-label">Queries</div>
                <div className="run-stat-value">
                  {lastRun.queriesMentioned}/{lastRun.totalQueries}
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Appear Rate</div>
                <div className="run-stat-value">
                  {lastRun.appearanceRate.toFixed(0)}%
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Avg Position</div>
                <div className="run-stat-value">
                  {lastRun.avgPosition !== null ? `#${lastRun.avgPosition.toFixed(1)}` : 'N/A'}
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Sentiment</div>
                <div className="run-stat-value">
                  <SentimentBar sentiment={lastRun.sentiment} />
                </div>
              </div>
            </>
          ) : (
            <div className="run-stat-empty">No previous run</div>
          )}
        </div>

        <div className="run-comparison-col">
          <div className="run-comparison-header">Change</div>
          {lastRun ? (
            <>
              <div className="run-stat">
                <div className="run-stat-label">Queries</div>
                <div className="run-stat-value">
                  <StatDelta
                    current={currentRun.queriesMentioned}
                    previous={lastRun.queriesMentioned}
                  />
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Appear Rate</div>
                <div className="run-stat-value">
                  <StatDelta
                    current={currentRun.appearanceRate}
                    previous={lastRun.appearanceRate}
                  />
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Avg Position</div>
                <div className="run-stat-value">
                  <PositionDelta
                    current={currentRun.avgPosition}
                    previous={lastRun.avgPosition}
                  />
                </div>
              </div>
              <div className="run-stat">
                <div className="run-stat-label">Sentiment</div>
                <div className="run-stat-value">
                  {/* Calculate positive percentage change */}
                  {(() => {
                    const currentTotal = currentRun.sentiment.positive + currentRun.sentiment.neutral + currentRun.sentiment.negative;
                    const lastTotal = lastRun.sentiment.positive + lastRun.sentiment.neutral + lastRun.sentiment.negative;
                    if (currentTotal === 0 || lastTotal === 0) return <span>-</span>;
                    const currentPosPct = (currentRun.sentiment.positive / currentTotal) * 100;
                    const lastPosPct = (lastRun.sentiment.positive / lastTotal) * 100;
                    return <StatDelta current={currentPosPct} previous={lastPosPct} />;
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="run-stat-empty">-</div>
          )}
        </div>

        {lifetimeStats && (
          <div className="run-comparison-col">
            <div className="run-comparison-header">Lifetime</div>
            <div className="run-stat">
              <div className="run-stat-label">Queries</div>
              <div className="run-stat-value">
                {lifetimeStats.queriesMentioned}/{lifetimeStats.totalQueries}
              </div>
            </div>
            <div className="run-stat">
              <div className="run-stat-label">Appear Rate</div>
              <div className="run-stat-value">
                {lifetimeStats.appearanceRate.toFixed(0)}%
              </div>
            </div>
            <div className="run-stat">
              <div className="run-stat-label">Avg Position</div>
              <div className="run-stat-value">
                {lifetimeStats.avgPosition !== null ? `#${lifetimeStats.avgPosition.toFixed(1)}` : 'N/A'}
              </div>
            </div>
            <div className="run-stat">
              <div className="run-stat-label">Sentiment</div>
              <div className="run-stat-value">
                <SentimentBar sentiment={lifetimeStats.sentiment} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
