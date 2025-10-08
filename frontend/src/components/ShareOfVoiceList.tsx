import { ShareOfVoice } from '../types/api.ts';

const ShareOfVoiceList = ({ share }: { share: ShareOfVoice }) => {
  const entries = Object.entries(share);
  if (entries.length === 0) return <div className="empty-state">No share of voice data yet.</div>;
  return (
    <div className="sov-list">
      {entries.map(([brand, value]) => (
        <div key={brand} className="sov-list__row">
          <div className="sov-list__meta">
            <span className="sov-list__brand">{brand}</span>
            <span className="sov-list__value">{value}%</span>
          </div>
          <div className="sov-list__bar">
            <div className="sov-list__fill" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShareOfVoiceList;
