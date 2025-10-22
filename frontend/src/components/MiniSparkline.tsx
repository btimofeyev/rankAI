type MiniSparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

const MiniSparkline = ({
  data,
  width = 60,
  height = 20,
  color = 'var(--accent)',
  strokeWidth = 2
}: MiniSparklineProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MiniSparkline;
