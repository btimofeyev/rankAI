import { ReactNode } from 'react';

type MetricCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

const MetricCard = ({ title, subtitle, children, className = '' }: MetricCardProps) => {
  return (
    <section className={`panel ${className}`.trim()}>
      <header className="panel__header">
        <span className="panel__eyebrow">{title}</span>
        {subtitle && <span className="panel__subtitle">{subtitle}</span>}
      </header>
      <div className="panel__body">
        {children}
      </div>
    </section>
  );
};

export default MetricCard;
