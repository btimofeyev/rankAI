import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type SentimentData = {
  positive: number;
  neutral: number;
  negative: number;
};

const COLORS = {
  positive: '#5efc82',
  neutral: 'rgba(255,255,255,0.6)',
  negative: '#ff6b6b'
};

const SentimentChart = ({ sentiment }: { sentiment: SentimentData }) => {
  const data = [
    { name: 'Positive', value: sentiment.positive, color: COLORS.positive },
    { name: 'Neutral', value: sentiment.neutral, color: COLORS.neutral },
    { name: 'Negative', value: sentiment.negative, color: COLORS.negative }
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>No sentiment data</div>;
  }

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(15,17,21,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              fontSize: '13px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px', fontSize: '13px' }}>
        {data.map(item => (
          <div key={item.name} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '18px', color: item.color }}>
              {Math.round((item.value / total) * 100)}%
            </div>
            <div style={{ opacity: 0.7, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentChart;
