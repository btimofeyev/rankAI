const badgeStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.12)',
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: 0.8
};

const PlanBadge = ({ tier }: { tier: 'free' | 'pro' }) => {
  return <span style={badgeStyle}>{tier === 'pro' ? 'Pro Access' : 'Free Snapshot'}</span>;
};

export default PlanBadge;
