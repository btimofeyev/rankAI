import { TrendPoint } from '../types/api.ts';

const svgStyle: React.CSSProperties = {
  width: '100%',
  height: '160px'
};

const TrendChart = ({ points }: { points: TrendPoint[] }) => {
  if (points.length === 0) return <div style={{ opacity: 0.6 }}>No trend data yet.</div>;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? 100 / (points.length - 1) : 0;
  const path = points
    .map((point, index) => {
      const x = step * index;
      const y = 100 - (point.value / maxValue) * 90;
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');
  const gradientId = 'trendGradient';
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100,100 L 0,100 Z`} fill={`url(#${gradientId})`} opacity={0.4} />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      {points.map((point, index) => {
        const x = step * index;
        const y = 100 - (point.value / maxValue) * 90;
        return <circle key={point.week} cx={x} cy={y} r={1.2} fill="var(--accent)" />;
      })}
    </svg>
  );
};

export default TrendChart;
