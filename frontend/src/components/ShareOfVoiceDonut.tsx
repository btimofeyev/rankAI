import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Card from './Card.tsx';

type ShareDatum = {
  name: string;
  value: number;
};

type ShareOfVoiceDonutProps = {
  data: ShareDatum[];
  focusBrand: string;
  height?: number;
  showSummary?: boolean;
};

// Simplified 2-tone color scheme following Kole Jain's principles
const COLORS = {
  primary: '#7c3aed', // --color-accent
  secondary: '#94a3b8', // --color-text-tertiary
  accent: '#f59e0b' // accent orange for leading competitor
};

const ShareOfVoiceDonut = ({
  data,
  focusBrand,
  height = 240,
  showSummary = true
}: ShareOfVoiceDonutProps) => {
  if (!data || data.length === 0) {
    return (
      <Card variant="ghost" className="share-of-voice">
        <div className="share-of-voice__empty">
          <div className="share-of-voice__empty-icon">🎯</div>
          <h4 className="share-of-voice__empty-title">No share data yet</h4>
          <p className="share-of-voice__empty-description">
            Run an analysis to see share of voice distribution.
          </p>
        </div>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const focusBrandData = sorted.find(entry => entry.name === focusBrand);
  const topCompetitor = sorted.find(entry => entry.name !== focusBrand);

  // Assign colors based on focus
  const coloredData = sorted.map((entry, index) => {
    if (entry.name === focusBrand) {
      return { ...entry, color: COLORS.primary };
    } else if (entry === topCompetitor && entry.value > 20) {
      return { ...entry, color: COLORS.accent };
    } else {
      return { ...entry, color: COLORS.secondary };
    }
  });

  // Calculate summary metrics
  const totalShare = sorted.reduce((sum, point) => sum + point.value, 0);
  const focusShare = focusBrandData?.value || 0;
  const competitiveGap = focusBrandData && topCompetitor
    ? focusBrandData.value - topCompetitor.value
    : 0;

  return (
    <Card className="share-of-voice">
      {/* Header with title and summary */}
      <div className="share-of-voice__header">
        <div className="share-of-voice__title-section">
          <h3 className="share-of-voice__title">Voice Distribution</h3>
          {showSummary && (
            <div className="share-of-voice__summary">
              <div className="share-of-voice__metric">
                <span className="share-of-voice__metric-value">{focusShare.toFixed(1)}%</span>
                <span className="share-of-voice__metric-label">Your share</span>
              </div>
              {topCompetitor && (
                <div className="share-of-voice__metric">
                  <span className="share-of-voice__metric-value">{topCompetitor.value.toFixed(1)}%</span>
                  <span className="share-of-voice__metric-label">Top competitor</span>
                </div>
              )}
              {competitiveGap !== 0 && (
                <div className={`share-of-voice__metric ${competitiveGap > 0 ? 'share-of-voice__metric--positive' : 'share-of-voice__metric--negative'}`}>
                  <span className="share-of-voice__metric-value">
                    {competitiveGap > 0 ? '+' : ''}{competitiveGap.toFixed(1)}%
                  </span>
                  <span className="share-of-voice__metric-label">vs leader</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="share-of-voice__chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coloredData}
              dataKey="value"
              nameKey="name"
              innerRadius={height * 0.25}
              outerRadius={height * 0.4}
              paddingAngle={coloredData.length > 1 ? 1 : 0}
              startAngle={90}
              endAngle={-270}
            >
              {coloredData.map((entry) => {
                const isFocus = entry.name === focusBrand;
                return (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={isFocus ? 1 : 0.6}
                    strokeWidth={isFocus ? 2 : 0}
                    stroke={isFocus ? 'rgba(124, 58, 237, 0.2)' : 'none'}
                  />
                );
              })}
            </Pie>

            {/* Minimal tooltip */}
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Share']}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#f8fafc',
                padding: '8px 12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center metric */}
        <div className="share-of-voice__center">
          <span className="share-of-voice__center-value">{focusShare.toFixed(0)}%</span>
          <span className="share-of-voice__center-label">Your share</span>
        </div>
      </div>

      {/* Simplified legend */}
      <div className="share-of-voice__legend">
        {sorted.slice(0, 3).map((entry) => {
          const isFocus = entry.name === focusBrand;
          const color = isFocus ? COLORS.primary : entry === topCompetitor ? COLORS.accent : COLORS.secondary;

          return (
            <div key={entry.name} className="share-of-voice__legend-item">
              <div
                className="share-of-voice__legend-indicator"
                style={{ backgroundColor: color }}
              />
              <div className="share-of-voice__legend-content">
                <span className="share-of-voice__legend-name">
                  {entry.name}
                  {isFocus && <span className="share-of-voice__legend-badge">You</span>}
                </span>
                <span className="share-of-voice__legend-value">{entry.value.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}

        {sorted.length > 3 && (
          <div className="share-of-voice__legend-more">
            +{sorted.length - 3} more
          </div>
        )}
      </div>

      {/* Footer with insights */}
      {showSummary && (
        <div className="share-of-voice__footer">
          <div className="share-of-voice__insights">
            <div className="share-of-voice__insight">
              <span className="share-of-voice__insight-label">Market position:</span>
              <span className="share-of-voice__insight-value">
                {focusShare > 50 ? 'Leader' : focusShare > 25 ? 'Strong competitor' : 'Growing presence'}
              </span>
            </div>
            <div className="share-of-voice__insight">
              <span className="share-of-voice__insight-label">Competitive intensity:</span>
              <span className="share-of-voice__insight-value">
                {sorted.length > 5 ? 'High' : sorted.length > 2 ? 'Moderate' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export type { ShareDatum };
export default ShareOfVoiceDonut;
