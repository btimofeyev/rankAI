import { Citation } from '../types/api.ts';

type CitationsDisplayProps = {
  citations: Citation[];
  compact?: boolean;
};

const CitationsDisplay = ({ citations, compact = false }: CitationsDisplayProps) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  if (compact) {
    // Compact mode: just show count and domains
    const uniqueDomains = Array.from(new Set(citations.map(c => c.domain)));
    const displayDomains = uniqueDomains.slice(0, 3);
    const remaining = uniqueDomains.length - displayDomains.length;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        <span style={{
          padding: '3px 8px',
          borderRadius: '8px',
          background: 'rgba(91, 140, 254, 0.15)',
          color: 'var(--accent)',
          fontWeight: 600,
          fontSize: '11px'
        }}>
          🌐 {citations.length} source{citations.length !== 1 ? 's' : ''}
        </span>
        <span style={{ opacity: 0.6, fontSize: '11px' }}>
          {displayDomains.join(', ')}
          {remaining > 0 && ` +${remaining} more`}
        </span>
      </div>
    );
  }

  // Full mode: show citation cards
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        opacity: 0.6,
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>🌐</span>
        <span>Web Sources ({citations.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {citations.map((citation, idx) => (
          <a
            key={`${citation.url}-${idx}`}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(91, 140, 254, 0.2)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91, 140, 254, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(91, 140, 254, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(91, 140, 254, 0.2)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {citation.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.6,
                  marginBottom: citation.snippet ? '8px' : '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {citation.domain}
                </div>
                {citation.snippet && (
                  <div style={{
                    fontSize: '12px',
                    opacity: 0.8,
                    lineHeight: 1.4,
                    fontStyle: 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{citation.snippet}"
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '16px',
                opacity: 0.4,
                flexShrink: 0
              }}>
                ↗
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default CitationsDisplay;
