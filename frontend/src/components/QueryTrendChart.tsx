import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QueryTrendDataPoint } from '../types/api.ts';

type QueryTrendChartProps = {
  dataPoints: QueryTrendDataPoint[];
  brandName: string;
  competitors: string[];
};

const QueryTrendChart = ({ dataPoints, brandName, competitors }: QueryTrendChartProps) => {
  // Transform data for recharts format
  const chartData = dataPoints.map((point, idx) => {
    const date = new Date(point.date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dataPoint: Record<string, string | number | null> = {
      date: formattedDate,
      runIndex: idx + 1,
      [brandName]: point.appeared ? (point.position || 0) : null,
    };

    // Add competitor positions
    for (const comp of competitors) {
      dataPoint[comp] = point.competitorPositions[comp] || null;
    }

    return dataPoint;
  });

  // Color palette
  const colors = {
    brand: 'var(--accent)',
    competitors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94']
  };

  if (dataPoints.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        opacity: 0.6,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px'
      }}>
        No trend data available yet. Run multiple analyses to see trends.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>Position Over Time</h4>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
          Lower position numbers are better (e.g., #1 is best)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            reversed
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.7)' } }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1d24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: 'var(--accent)', marginBottom: '4px' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />

          {/* Brand line */}
          <Line
            type="monotone"
            dataKey={brandName}
            stroke={colors.brand}
            strokeWidth={3}
            dot={{ r: 4, fill: colors.brand }}
            connectNulls
            name={`${brandName} (you)`}
          />

          {/* Competitor lines */}
          {competitors.map((comp, idx) => (
            <Line
              key={comp}
              type="monotone"
              dataKey={comp}
              stroke={colors.competitors[idx % colors.competitors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
              name={comp}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default QueryTrendChart;
