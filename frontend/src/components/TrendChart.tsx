import { useMemo } from 'react';
import { TrendPoint } from '../types/api.ts';

const TrendChart = ({ points }: { points: TrendPoint[] }) => {
  if (points.length === 0) return <div className="empty-state">No trend data yet.</div>;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? 100 / (points.length - 1) : 0;
  const path = points
    .map((point, index) => {
      const x = step * index;
      const y = 100 - (point.value / maxValue) * 90;
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');
  const gradientId = useMemo(
    () => `trendGradient-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="trend-chart">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.56" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100,100 L 0,100 Z`} fill={`url(#${gradientId})`} opacity={0.4} />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
      {points.map((point, index) => {
        const x = step * index;
        const y = 100 - (point.value / maxValue) * 90;
        return <circle key={point.week} cx={x} cy={y} r={1.4} fill="#1d4ed8" />;
      })}
    </svg>
  );
};

export default TrendChart;
