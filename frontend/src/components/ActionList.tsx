const pillStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(91, 140, 254, 0.08)'
};

const ActionList = ({ actions }: { actions: string[] }) => {
  if (actions.length === 0) return <div style={{ opacity: 0.6 }}>All signals nominal. Re-run analysis next week.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {actions.map((action) => (
        <div key={action} style={pillStyle}>{action}</div>
      ))}
    </div>
  );
};

export default ActionList;
