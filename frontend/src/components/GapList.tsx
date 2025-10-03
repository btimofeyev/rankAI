import { GapOpportunity } from '../types/api.ts';

const itemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)'
};

const GapList = ({ gaps }: { gaps: GapOpportunity[] }) => {
  if (gaps.length === 0) return <div style={{ opacity: 0.6 }}>Solid coverage across monitored prompts.</div>;
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {gaps.map((gap) => (
        <div key={gap.query} style={itemStyle}>
          <strong>{gap.query}</strong>
          <span style={{ opacity: 0.7 }}>Competitor leading: {gap.dominatingCompetitor}</span>
          <span style={{ opacity: 0.6, fontSize: '14px' }}>{gap.recommendation}</span>
        </div>
      ))}
    </div>
  );
};

export default GapList;
