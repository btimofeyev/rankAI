import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

type SentimentEntry = {
  label: string;
  value: number;
  pct: number;
  tone: 'positive' | 'neutral' | 'negative';
};

type SentimentGaugeProps = {
  data: SentimentEntry[];
  height?: number;
};

const toneColor: Record<SentimentEntry['tone'], string> = {
  positive: '#22c55e',
  neutral: '#64748b',
  negative: '#ef4444'
};

const tooltipStyles = {
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  borderRadius: 12,
  border: 'none',
  padding: '12px 16px',
  boxShadow: '0 12px 32px -24px rgba(15, 23, 42, 0.85)'
};

const SentimentGauge = ({ data, height }: SentimentGaugeProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        Sentiment will unlock after a completed analysis run.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const primary = [...data].sort((a, b) => b.value - a.value)[0];
  const chartData = data.map((entry) => ({
    ...entry,
    fill: toneColor[entry.tone]
  }));
  const chartHeight = height ?? 260;

  return (
    <div className="sentiment-gauge">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RadialBarChart
          cx="50%"
          cy="56%"
          innerRadius="30%"
          outerRadius="110%"
          barSize={20}
          data={chartData}
          startAngle={225}
          endAngle={-45}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, total]}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={12}
            clockWise
            minAngle={15}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value} mentions`, name]}
            contentStyle={tooltipStyles}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="sentiment-gauge__center">
        <span className="sentiment-gauge__value">{total}</span>
        <span className="sentiment-gauge__label">Mentions scored</span>
        {primary && (
          <span className="sentiment-gauge__tone" data-tone={primary.tone}>
            {primary.label} leads · {primary.pct}%
          </span>
        )}
      </div>
      <ul className="sentiment-gauge__legend">
        {data.map((entry) => (
          <li key={entry.label}>
            <span
              className="sentiment-gauge__bullet"
              style={{ backgroundColor: toneColor[entry.tone] }}
            />
            <div>
              <span className="sentiment-gauge__legend-title">{entry.label}</span>
              <span className="sentiment-gauge__legend-meta">
                {entry.value} mentions · {entry.pct}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export type { SentimentEntry };
export default SentimentGauge;
