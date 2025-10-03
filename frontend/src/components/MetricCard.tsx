import { ReactNode } from 'react';

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: '180px'
};

const MetricCard = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <div style={cardStyle}>
      <span style={{ fontSize: '12px', letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.6 }}>{title}</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  );
};

export default MetricCard;
