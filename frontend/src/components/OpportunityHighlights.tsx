type OpportunityHighlight = {
  query: string;
  competitor: string;
  competitorPosition: number | null;
  appearanceRate: number;
  severity: 'critical' | 'warning' | 'monitor';
  recommendation: string;
};

type OpportunityHighlightsProps = {
  items: OpportunityHighlight[];
};

const severityCopy: Record<OpportunityHighlight['severity'], string> = {
  critical: 'Missing entirely',
  warning: 'Needs lift',
  monitor: 'Monitor'
};

const OpportunityHighlights = ({ items }: OpportunityHighlightsProps) => {
  if (items.length === 0) {
    return (
      <div className="opportunity-empty">
        You&#39;re showing up across every tracked prompt. Add more queries or expand the scope to uncover new gaps.
      </div>
    );
  }

  return (
    <div className="opportunity-highlights">
      <ul>
        {items.map((item) => (
          <li key={item.query}>
            <div className="opportunity-headline">
              <span className="opportunity-query">{item.query}</span>
              <span className={`opportunity-severity opportunity-severity--${item.severity}`}>
                {severityCopy[item.severity]}
              </span>
            </div>
            <div className="opportunity-meta">
              {item.competitor} ranking {item.competitorPosition ? `#${item.competitorPosition}` : 'in answer'} ·{' '}
              {item.appearanceRate.toFixed(0)}% appearance rate
            </div>
            <div className="opportunity-recommendation">{item.recommendation}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export type { OpportunityHighlight };
export default OpportunityHighlights;
