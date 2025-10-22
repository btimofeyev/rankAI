import Button from './Button.tsx';

type SimplifiedStatsBarProps = {
  trackedCount: number;
  maxQueries: number;
  avgAppearanceRate: number;
  avgPosition: number;
  onRunAnalysis: () => void;
  isRunning: boolean;
};

const SimplifiedStatsBar = ({
  trackedCount,
  maxQueries,
  avgAppearanceRate,
  avgPosition,
  onRunAnalysis,
  isRunning
}: SimplifiedStatsBarProps) => {
  return (
    <div className="stats-bar">
      <div className="stats-bar__metrics">
        <div className="stats-bar__metric">
          <span className="stats-bar__label">Queries tracked</span>
          <span className="stats-bar__value">
            {trackedCount}
            <span className="stats-bar__aux">/ {maxQueries}</span>
          </span>
        </div>
        <div className="stats-bar__metric">
          <span className="stats-bar__label">Avg appearance</span>
          <span className="stats-bar__value">{avgAppearanceRate}%</span>
        </div>
        <div className="stats-bar__metric">
          <span className="stats-bar__label">Avg position</span>
          <span className="stats-bar__value">{avgPosition > 0 ? `#${avgPosition}` : '—'}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onRunAnalysis}
        disabled={isRunning || trackedCount === 0}
      >
        {isRunning ? 'Running…' : 'Run analysis'}
      </Button>
    </div>
  );
};

export default SimplifiedStatsBar;
