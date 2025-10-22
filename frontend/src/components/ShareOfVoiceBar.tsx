import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type ShareDatum = {
  name: string;
  value: number;
};

type ShareOfVoiceBarProps = {
  data: ShareDatum[];
  focusBrand: string;
  height?: number;
};

const tooltipStyles = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  boxShadow: '0 14px 32px -24px rgba(15, 23, 42, 0.85)',
  fontSize: '0.82rem'
};

const ShareOfVoiceBar = ({ data, focusBrand, height }: ShareOfVoiceBarProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        Share of voice appears after you complete an analysis.
      </div>
    );
  }

  const items = [...data].slice(0, 6);
  const maxValue = Math.max(100, ...items.map((item) => item.value));
  const chartHeight = height ?? 260;

  return (
    <div className="sov-bar">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(148, 163, 184, 0.25)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, maxValue]}
            stroke="rgba(15, 23, 42, 0.45)"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: '0.78rem' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="rgba(15, 23, 42, 0.55)"
            tickLine={false}
            axisLine={false}
            width={120}
            style={{ fontSize: '0.82rem' }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Share']}
            contentStyle={tooltipStyles}
          />
          <Bar dataKey="value" radius={[10, 10, 10, 10]} background={{ fill: 'rgba(148, 163, 184, 0.18)' }}>
            {items.map((entry) => {
              const isFocus = entry.name === focusBrand;
              return (
                <Cell
                  key={entry.name}
                  fill={isFocus ? '#4338ca' : '#94a3b8'}
                  opacity={isFocus ? 1 : 0.8}
                />
              );
            })}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: number) => `${value}%`}
              style={{ fontSize: '0.8rem', fill: '#0f172a', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export type { ShareDatum };
export default ShareOfVoiceBar;
