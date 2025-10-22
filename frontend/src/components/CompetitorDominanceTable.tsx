import MiniSparkline from './MiniSparkline';

type CompetitorMetrics = {
  name: string;
  isYourBrand: boolean;
  appearanceRate: number;
  avgPosition: number | null;
  trendData: number[]; // Last 10 runs
  dominatedQueries: number; // Queries where this competitor ranks #1
};

type CompetitorDominanceTableProps = {
  competitors: CompetitorMetrics[];
  totalQueries: number;
};

function GapStatus({ appearanceRate, isYourBrand }: { appearanceRate: number; isYourBrand: boolean }) {
  if (isYourBrand) {
    if (appearanceRate >= 70) {
      return <span className="gap-status gap-excellent">Excellent</span>;
    }
    if (appearanceRate >= 40) {
      return <span className="gap-status gap-good">Strong</span>;
    }
    if (appearanceRate >= 20) {
      return <span className="gap-status gap-warning">Weak</span>;
    }
    return <span className="gap-status gap-critical">Critical</span>;
  }

  // For competitors
  if (appearanceRate >= 60) {
    return <span className="gap-status gap-competitor-high">Dominates</span>;
  }
  if (appearanceRate >= 30) {
    return <span className="gap-status gap-competitor-medium">Strong</span>;
  }
  return <span className="gap-status gap-competitor-low">Weak</span>;
}

export function CompetitorDominanceTable({ competitors, totalQueries }: CompetitorDominanceTableProps) {
  // Sort by appearance rate descending
  const sortedCompetitors = [...competitors].sort((a, b) => b.appearanceRate - a.appearanceRate);

  return (
    <div className="competitor-dominance-table">
      <h3>COMPETITOR ANALYSIS</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Brand</th>
              <th>Appear Rate</th>
              <th>Avg Position</th>
              <th>Trend</th>
              <th>#1 Ranks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedCompetitors.map((competitor) => (
              <tr key={competitor.name} className={competitor.isYourBrand ? 'your-brand-row' : ''}>
                <td className="competitor-name-cell">
                  {competitor.name}
                  {competitor.isYourBrand && <span className="you-tag">You</span>}
                </td>
                <td className="appearance-rate-cell">
                  <strong>{competitor.appearanceRate.toFixed(0)}%</strong>
                  <span className="appearance-count">
                    ({Math.round((competitor.appearanceRate / 100) * totalQueries)} queries)
                  </span>
                </td>
                <td className="avg-position-cell">
                  {competitor.avgPosition !== null ? (
                    <span className={`position-badge position-${Math.ceil(competitor.avgPosition)}`}>
                      #{competitor.avgPosition.toFixed(1)}
                    </span>
                  ) : (
                    <span className="no-data">N/A</span>
                  )}
                </td>
                <td className="trend-cell">
                  {competitor.trendData.length > 0 ? (
                    <MiniSparkline
                      data={competitor.trendData}
                      width={80}
                      height={24}
                      color={competitor.isYourBrand ? '#6366f1' : '#6b7280'}
                    />
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
                <td className="dominated-queries-cell">
                  {competitor.dominatedQueries > 0 ? (
                    <strong>{competitor.dominatedQueries}</strong>
                  ) : (
                    <span className="no-data">0</span>
                  )}
                </td>
                <td className="gap-status-cell">
                  <GapStatus
                    appearanceRate={competitor.appearanceRate}
                    isYourBrand={competitor.isYourBrand}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(() => {
        const yourBrand = sortedCompetitors.find(c => c.isYourBrand);
        if (!yourBrand) return null;

        const topCompetitor = sortedCompetitors.find(c => !c.isYourBrand);
        if (!topCompetitor) return null;

        const gap = topCompetitor.appearanceRate - yourBrand.appearanceRate;

        if (gap > 20) {
          return (
            <div className="competitor-insight warning">
              <span className="insight-badge warning">[WARNING]</span> <strong>{topCompetitor.name}</strong> appears {gap.toFixed(0)}% more often than you.
              Focus on queries where they dominate.
            </div>
          );
        }

        if (yourBrand.appearanceRate > topCompetitor.appearanceRate + 20) {
          return (
            <div className="competitor-insight success">
              <span className="insight-badge success">[SUCCESS]</span> You're leading the market with {(yourBrand.appearanceRate - topCompetitor.appearanceRate).toFixed(0)}%
              more visibility than your closest competitor.
            </div>
          );
        }

        return (
          <div className="competitor-insight neutral">
            Competition is tight. Focus on maintaining your position and targeting gap queries.
          </div>
        );
      })()}
    </div>
  );
}
