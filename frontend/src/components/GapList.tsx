import { GapOpportunity } from '../types/api.ts';

const GapList = ({ gaps }: { gaps: GapOpportunity[] }) => {
  const items = gaps.slice(0, 3);
  if (items.length === 0) return <div className="empty-state">Solid coverage across monitored prompts.</div>;
  return (
    <div className="gap-list">
      {items.map((gap) => (
        <div key={gap.query} className="gap-list__item">
          <span className="gap-list__query">{gap.query}</span>
          <span className="gap-list__meta">Dominant voice: {gap.dominatingCompetitor}</span>
          <span className="dashboard-note">{gap.recommendation}</span>
        </div>
      ))}
    </div>
  );
};

export default GapList;
