const PlanBadge = ({ tier }: { tier: 'free' | 'pro' }) => {
  return (
    <span className="plan-badge" data-tier={tier}>
      {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
    </span>
  );
};

export default PlanBadge;
