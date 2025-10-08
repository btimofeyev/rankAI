import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TrendPoint = {
  week: string;
  [brand: string]: string | number;
};

const CHART_COLORS = [
  '#5b8cfe', // Primary blue
  '#ff6b6b', // Red
  '#5efc82', // Green
  '#feca57', // Yellow
  '#a29bfe', // Purple
  '#fd79a8'  // Pink
];

const ComparisonChart = ({
  data,
  brands
}: {
  data: TrendPoint[];
  brands: string[];
}) => {
  if (data.length === 0) {
    return <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>No trend data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="week"
          stroke="rgba(255,255,255,0.5)"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.5)"
          style={{ fontSize: '12px' }}
          label={{ value: 'Queries Appeared In', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: 'rgba(255,255,255,0.5)' } }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(15,17,21,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            fontSize: '13px'
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />
        {brands.map((brand, index) => (
          <Line
            key={brand}
            type="monotone"
            dataKey={brand}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ComparisonChart;
