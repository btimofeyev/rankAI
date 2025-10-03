import { ShareOfVoice } from '../types/api.ts';

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const ShareOfVoiceList = ({ share }: { share: ShareOfVoice }) => {
  const entries = Object.entries(share);
  if (entries.length === 0) return <div style={{ opacity: 0.6 }}>No data yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {entries.map(([brand, value]) => (
        <div key={brand} style={rowStyle}>
          <span>{brand}</span>
          <span style={{ fontWeight: 600 }}>{value}%</span>
        </div>
      ))}
    </div>
  );
};

export default ShareOfVoiceList;
