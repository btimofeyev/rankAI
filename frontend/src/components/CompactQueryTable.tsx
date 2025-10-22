import MiniSparkline from './MiniSparkline';

type CompactQueryData = {
  query: string;
  yourStatus: {
    appeared: boolean;
    position: number | null;
    sentiment: 'positive' | 'neutral' | 'negative' | null;
    appearanceRate: number;
  };
  topCompetitor: {
    name: string | null;
    position: number | null;
  };
  trend: number[]; // Last 10 runs: 1 = appeared, 0 = absent
  isTracked: boolean;
};

type CompactQueryTableProps = {
  queries: CompactQueryData[];
  brandName: string;
  onQueryClick?: (query: string) => void;
  onRemoveQuery?: (query: string) => void;
  limit?: number;
  showUntracked?: boolean;
};

function StatusBadge({ status, brandName }: { status: CompactQueryData['yourStatus']; brandName: string }) {
  if (!status.appeared) {
    return <span className="status-badge status-absent">Absent</span>;
  }

  if (status.position === 1) {
    return (
      <span className="status-badge status-first">
        #{status.position}
      </span>
    );
  }

  if (status.position && status.position <= 3) {
    return (
      <span className="status-badge status-top">
        #{status.position}
      </span>
    );
  }

  return (
    <span className="status-badge status-low">
      #{status.position}
    </span>
  );
}

export function CompactQueryTable({
  queries,
  brandName,
  onQueryClick,
  onRemoveQuery,
  limit,
  showUntracked = true
}: CompactQueryTableProps) {
  if (queries.length === 0) {
    return (
      <div className="compact-query-table-empty">
        <p>No tracked queries yet. Add queries to start tracking brand visibility.</p>
      </div>
    );
  }

  // Separate tracked and untracked
  const trackedQueries = queries.filter(q => q.isTracked);
  const untrackedQueries = queries.filter(q => !q.isTracked);
  const limitedTracked = typeof limit === 'number' ? trackedQueries.slice(0, limit) : trackedQueries;

  if (limitedTracked.length === 0 && (!showUntracked || untrackedQueries.length === 0)) {
    return (
      <div className="compact-query-table-empty">
        <p>No tracked queries yet. Add queries to start tracking brand visibility.</p>
      </div>
    );
  }

  const showLimitedHint = typeof limit === 'number' && trackedQueries.length > limitedTracked.length;

  return (
    <div className="compact-query-table-container">
      <div className="compact-query-table-header">
        <h3>QUERY PERFORMANCE</h3>
        <div className="query-count">{trackedQueries.length} tracked</div>
      </div>

      <div className="compact-query-table">
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Your Status</th>
              <th>Top Competitor</th>
              <th>Trend</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {limitedTracked.map((queryData) => (
              <tr
                key={queryData.query}
                className={onQueryClick ? "query-row" : "query-row-static"}
                onClick={onQueryClick ? () => onQueryClick(queryData.query) : undefined}
              >
                <td className="query-text">
                  <div className="query-text-content">{queryData.query}</div>
                  {queryData.yourStatus.appearanceRate > 0 && (
                    <div className="query-appearance-rate">
                      {queryData.yourStatus.appearanceRate.toFixed(0)}% appearance
                    </div>
                  )}
                </td>
                <td className="query-status">
                  <StatusBadge status={queryData.yourStatus} brandName={brandName} />
                </td>
                <td className="query-competitor">
                  {queryData.topCompetitor.name ? (
                    <div>
                      <div className="competitor-name">{queryData.topCompetitor.name}</div>
                      <div className="competitor-position">#{queryData.topCompetitor.position}</div>
                    </div>
                  ) : (
                    <span className="no-competitor">None</span>
                  )}
                </td>
                <td className="query-trend">
                  {queryData.trend.length > 0 ? (
                    <MiniSparkline
                      data={queryData.trend}
                      width={60}
                      height={20}
                      color={queryData.yourStatus.appeared ? '#10b981' : '#6b7280'}
                    />
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
                <td className="query-actions">
                  {onRemoveQuery && (
                    <button
                      className="remove-query-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveQuery(queryData.query);
                      }}
                      title="Remove query"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLimitedHint && (
        <div className="compact-query-table-hint">
          Showing {limitedTracked.length} of {trackedQueries.length} tracked queries.
        </div>
      )}

      {showUntracked && untrackedQueries.length > 0 && (
        <details className="untracked-queries-section">
          <summary>Untracked Queries ({untrackedQueries.length})</summary>
          <div className="compact-query-table">
            <table>
              <tbody>
                {untrackedQueries.map((queryData) => (
                  <tr
                    key={queryData.query}
                    className={onQueryClick ? "query-row untracked" : "query-row-static untracked"}
                    onClick={onQueryClick ? () => onQueryClick(queryData.query) : undefined}
                  >
                    <td className="query-text">
                      <div className="query-text-content">{queryData.query}</div>
                    </td>
                    <td className="query-status">
                      <StatusBadge status={queryData.yourStatus} brandName={brandName} />
                    </td>
                    <td className="query-competitor">
                      {queryData.topCompetitor.name ?? 'None'}
                    </td>
                    <td className="query-trend">
                      {queryData.trend.length > 0 ? (
                        <MiniSparkline
                          data={queryData.trend}
                          width={60}
                          height={20}
                          color="#6b7280"
                        />
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
