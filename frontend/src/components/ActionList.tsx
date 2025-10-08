const ActionList = ({ actions }: { actions: string[] }) => {
  const items = actions.slice(0, 4);
  if (items.length === 0) return <div className="empty-state">All signals steady. Re-run analysis next week.</div>;
  return (
    <div className="action-list">
      {items.map((action) => (
        <div key={action} className="action-list__item">{action}</div>
      ))}
    </div>
  );
};

export default ActionList;
