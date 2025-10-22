import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type MomentumAreaChartProps = {
  data: Array<Record<string, number | string>>;
  primaryKey: string;
  comparisonKeys: string[];
  height?: number;
};

const tooltipStyles = {
  backgroundColor: '#0b1120',
  color: '#e0e7ff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  boxShadow: '0 16px 38px -28px rgba(5, 10, 26, 0.8)'
};

const comparisonPalette = ['#22d3ee', '#a78bfa', '#38bdf8', '#f97316'];

const MomentumAreaChart = ({ data, primaryKey, comparisonKeys, height }: MomentumAreaChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        Trend data will appear after your first analysis run.
      </div>
    );
  }

  const resolvedPrimary = primaryKey || 'value';
  const visibleComparisons = comparisonKeys.slice(0, 4);
  const chartHeight = height ?? 260;

  return (
    <div className="momentum-chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart
          data={data}
          margin={{ top: 24, right: 24, bottom: 8, left: -12 }}
        >
          <defs>
            <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.65} />
              <stop offset="65%" stopColor="#7c3aed" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(148, 163, 184, 0.18)" />
          <XAxis
            dataKey="label"
            stroke="rgba(226, 232, 240, 0.42)"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: '0.75rem' }}
            minTickGap={24}
          />
          <YAxis
            stroke="rgba(226, 232, 240, 0.32)"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: '0.75rem' }}
            allowDecimals={false}
            width={48}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(124, 58, 237, 0.4)' }}
            contentStyle={tooltipStyles}
            labelStyle={{ fontWeight: 600 }}
            formatter={(value: number, name: string) => {
              const label = name === 'value' && resolvedPrimary !== 'value' ? resolvedPrimary : name;
              return [value, label];
            }}
          />
          <Area
            type="monotone"
            dataKey={resolvedPrimary}
            stroke="#7c3aed"
            strokeWidth={2.8}
            fill="url(#momentumGradient)"
            dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#f8fafc', stroke: '#7c3aed', strokeWidth: 1 }}
            name={resolvedPrimary === 'value' ? 'Your brand' : resolvedPrimary}
          />
          {visibleComparisons.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={comparisonPalette[index % comparisonPalette.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: comparisonPalette[index % comparisonPalette.length] }}
              name={key}
            />
          ))}
          {visibleComparisons.length > 0 && (
            <Legend
              align="left"
              verticalAlign="top"
              iconType="plainline"
              wrapperStyle={{ paddingBottom: 8, fontSize: '0.75rem' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MomentumAreaChart;
