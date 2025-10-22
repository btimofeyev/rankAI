import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from './Card.tsx';

type TrendDataPoint = {
  date: string;
  [brandName: string]: string | number;
};

type TrendLineChartProps = {
  snapshots: Array<{
    snapshotDate: string;
    brandMentions: number;
    competitorShares?: Record<string, number>;
    totalQueries: number;
  }>;
  brandName: string;
  competitors: string[];
  height?: number;
  showSummary?: boolean;
};

export function TrendLineChart({
  snapshots,
  brandName,
  competitors,
  height = 240,
  showSummary = true
}: TrendLineChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card variant="ghost" className="trend-chart">
        <div className="trend-chart__empty">
          <div className="trend-chart__empty-icon">📈</div>
          <h4 className="trend-chart__empty-title">No trend data yet</h4>
          <p className="trend-chart__empty-description">
            Run multiple analyses to see performance trends over time.
          </p>
        </div>
      </Card>
    );
  }

  // Prepare data for chart (last 10 runs, oldest to newest)
  const chartData: TrendDataPoint[] = snapshots
    .slice(0, 10)
    .reverse()
    .map((snapshot) => {
      const point: TrendDataPoint = {
        date: new Date(snapshot.snapshotDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      };

      // Add brand data (query appearances)
      point[brandName] = snapshot.brandMentions;

      // Add competitor data (calculate count from percentage)
      competitors.forEach((comp) => {
        const competitorSharePct = snapshot.competitorShares?.[comp] ?? 0;
        const competitorCount = Math.round((competitorSharePct / 100) * snapshot.totalQueries);
        point[comp] = competitorCount;
      });

      return point;
    });

  // Simplified color scheme following Kole Jain's principles
  const brandColor = '#7c3aed'; // --color-accent
  const competitorColors = [
    '#94a3b8', // --color-text-tertiary (soft gray)
    '#f59e0b', // accent orange for primary competitor
  ];

  // Calculate summary metrics
  const totalMentions = chartData.reduce((sum, point) => sum + (point[brandName] as number || 0), 0);
  const avgMentions = chartData.length > 0 ? Math.round(totalMentions / chartData.length) : 0;
  const latestValue = chartData[chartData.length - 1]?.[brandName] as number || 0;
  const previousValue = chartData.length > 1 ? chartData[chartData.length - 2]?.[brandName] as number || 0 : 0;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable';
  const trendValue = Math.abs(latestValue - previousValue);

  return (
    <Card className="trend-chart">
      {/* Header with title and summary */}
      <div className="trend-chart__header">
        <div className="trend-chart__title-section">
          <h3 className="trend-chart__title">Momentum</h3>
          {showSummary && (
            <div className="trend-chart__summary">
              <div className="trend-chart__metric">
                <span className="trend-chart__metric-value">{avgMentions}</span>
                <span className="trend-chart__metric-label">Avg mentions</span>
              </div>
              <div className="trend-chart__metric">
                <span className="trend-chart__metric-value">{totalMentions}</span>
                <span className="trend-chart__metric-label">Total mentions</span>
              </div>
              <div className={`trend-chart__metric trend-chart__metric--${trend}`}>
                <span className="trend-chart__metric-value">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </span>
                <span className="trend-chart__metric-label">vs previous</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="trend-chart__chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            {/* Soft grid lines */}
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(148, 163, 184, 0.1)"
              vertical={false}
            />

            {/* Clean axes */}
            <XAxis
              dataKey="date"
              stroke="rgba(148, 163, 184, 0.3)"
              style={{ fontSize: '0.7rem' }}
              tick={{ fill: 'rgba(148, 163, 184, 0.5)' }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.3)"
              style={{ fontSize: '0.7rem' }}
              tick={{ fill: 'rgba(148, 163, 184, 0.5)' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Minimal tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#f8fafc',
                padding: '8px 12px'
              }}
              labelStyle={{ color: 'rgba(148, 163, 184, 0.7)', marginBottom: '4px' }}
            />

            {/* Brand line (primary emphasis) */}
            <Line
              type="monotone"
              dataKey={brandName}
              stroke={brandColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: brandColor,
                stroke: 'rgba(124, 58, 237, 0.2)',
                strokeWidth: 2
              }}
            />

            {/* Competitor lines (subtle) */}
            {competitors.slice(0, 2).map((competitor, index) => (
              <Line
                key={competitor}
                type="monotone"
                dataKey={competitor}
                stroke={competitorColors[index]}
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                activeDot={{
                  r: 4,
                  fill: competitorColors[index],
                  stroke: 'rgba(148, 163, 184, 0.2)',
                  strokeWidth: 1.5
                }}
                opacity={0.6}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with key insights */}
      {showSummary && (
        <div className="trend-chart__footer">
          <div className="trend-chart__insights">
            <div className="trend-chart__insight">
              <span className="trend-chart__insight-label">Performance trend:</span>
              <span className={`trend-chart__insight-value trend-chart__insight-value--${trend}`}>
                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
            <div className="trend-chart__insight">
              <span className="trend-chart__insight-label">Data points:</span>
              <span className="trend-chart__insight-value">{chartData.length} periods</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
