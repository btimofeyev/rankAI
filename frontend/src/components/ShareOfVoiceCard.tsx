type ShareOfVoiceData = {
  brand: string;
  percentage: number;
  mentions: number;
  isYourBrand: boolean;
  trend?: 'up' | 'down' | 'stable';
  previousPercentage?: number;
};

type ShareOfVoiceCardProps = {
  brandName: string;
  currentRun: ShareOfVoiceData[];
  lastRun?: ShareOfVoiceData[];
  lifetime?: ShareOfVoiceData[];
};

function TrendBadge({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) {
    return <span className="trend-badge trend-new">[NEW]</span>;
  }

  const delta = current - previous;
  const trend = Math.abs(delta) < 1 ? 'stable' : delta > 0 ? 'up' : 'down';

  const icons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  const colors = {
    up: 'trend-up',
    down: 'trend-down',
    stable: 'trend-stable'
  };

  return (
    <span className={`trend-badge ${colors[trend]}`}>
      {icons[trend]} {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

export function ShareOfVoiceCard({ brandName, currentRun, lastRun, lifetime }: ShareOfVoiceCardProps) {
  // Sort by percentage descending
  const sortedCurrent = [...currentRun].sort((a, b) => b.percentage - a.percentage);
  const maxPercentage = Math.max(...sortedCurrent.map(d => d.percentage), 1);

  // Find previous data for each brand
  const getPreviousPercentage = (brand: string): number | undefined => {
    return lastRun?.find(d => d.brand === brand)?.percentage;
  };

  const getLifetimePercentage = (brand: string): number | undefined => {
    return lifetime?.find(d => d.brand === brand)?.percentage;
  };

  // Get your brand's stats
  const yourBrand = sortedCurrent.find(d => d.isYourBrand);
  const yourLifetime = yourBrand ? getLifetimePercentage(yourBrand.brand) : undefined;
  const yourLast = yourBrand ? getPreviousPercentage(yourBrand.brand) : undefined;

  return (
    <div className="share-of-voice-card">
      <div className="card-header">
        <h3>SHARE OF VOICE</h3>
        <div className="card-subtitle">
          Who's dominating AI recommendations
        </div>
      </div>

      <div className="share-of-voice-bars">
        {sortedCurrent.map((data) => {
          const previousPct = getPreviousPercentage(data.brand);
          const barWidth = (data.percentage / maxPercentage) * 100;

          return (
            <div
              key={data.brand}
              className={`voice-bar-row ${data.isYourBrand ? 'your-brand' : ''}`}
            >
              <div className="voice-bar-label">
                <span className="brand-name">
                  {data.brand}
                  {data.isYourBrand && <span className="you-badge">You</span>}
                </span>
                <TrendBadge current={data.percentage} previous={previousPct} />
              </div>

              <div className="voice-bar-container">
                <div
                  className={`voice-bar ${data.isYourBrand ? 'your-brand-bar' : 'competitor-bar'}`}
                  style={{ width: `${barWidth}%` }}
                >
                  <span className="voice-bar-text">
                    {data.percentage.toFixed(1)}% ({data.mentions} {data.mentions === 1 ? 'mention' : 'mentions'})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(yourLifetime !== undefined || yourLast !== undefined) && (
        <div className="voice-summary">
          <div className="voice-summary-stat">
            <span className="voice-summary-label">This Run:</span>
            <span className="voice-summary-value">{yourBrand?.percentage.toFixed(1)}%</span>
          </div>
          {yourLast !== undefined && (
            <div className="voice-summary-stat">
              <span className="voice-summary-label">Last Run:</span>
              <span className="voice-summary-value">{yourLast.toFixed(1)}%</span>
            </div>
          )}
          {yourLifetime !== undefined && (
            <div className="voice-summary-stat">
              <span className="voice-summary-label">Lifetime:</span>
              <span className="voice-summary-value">{yourLifetime.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {yourBrand && yourBrand.percentage < 25 && (
        <div className="voice-warning">
          <span className="warning-badge">[CRITICAL]</span> Your share of voice is below 25%. Competitors are dominating recommendations.
        </div>
      )}
    </div>
  );
}
