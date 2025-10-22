import MiniSparkline from './MiniSparkline.tsx';

type CompetitorBadgeProps = {
  name: string;
  position: number | null;
  appearanceRate: number;
  trendData?: number[];
  isYourBrand?: boolean;
};

const CompetitorBadge = ({
  name,
  position,
  appearanceRate,
  trendData = [],
  isYourBrand = false
}: CompetitorBadgeProps) => {
  const getBadgeColor = () => {
    if (!position) return 'rgba(255, 107, 107, 0.15)'; // Not mentioned - red
    if (isYourBrand) {
      if (position === 1) return 'rgba(94, 252, 130, 0.15)'; // #1 - green
      if (position <= 3) return 'rgba(255, 184, 0, 0.15)'; // Top 3 - yellow
      return 'rgba(255, 107, 107, 0.15)'; // Below top 3 - red
    }
    return 'rgba(91, 140, 254, 0.08)'; // Competitor - blue
  };

  const getBorderColor = () => {
    if (!position) return 'rgba(255, 107, 107, 0.3)';
    if (isYourBrand) {
      if (position === 1) return 'rgba(94, 252, 130, 0.3)';
      if (position <= 3) return 'rgba(255, 184, 0, 0.3)';
      return 'rgba(255, 107, 107, 0.3)';
    }
    return 'rgba(91, 140, 254, 0.2)';
  };

  const getTextColor = () => {
    if (!position) return 'var(--danger)';
    if (isYourBrand && position === 1) return 'var(--success)';
    return 'inherit';
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: getBadgeColor(),
        border: `1px solid ${getBorderColor()}`,
        flex: 1,
        minWidth: '150px'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: isYourBrand ? 700 : 600,
          color: getTextColor()
        }}>
          {isYourBrand && '🎯 '}
          {name}
        </div>
        {position ? (
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: getTextColor()
          }}>
            #{position}
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            opacity: 0.7,
            color: 'var(--danger)'
          }}>
            Not mentioned
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        opacity: 0.8
      }}>
        <span>{appearanceRate}% appear</span>
        {trendData.length > 0 && (
          <MiniSparkline
            data={trendData}
            width={40}
            height={16}
            color={isYourBrand ? 'var(--accent)' : 'rgba(255,255,255,0.5)'}
            strokeWidth={1.5}
          />
        )}
      </div>
    </div>
  );
};

export default CompetitorBadge;
