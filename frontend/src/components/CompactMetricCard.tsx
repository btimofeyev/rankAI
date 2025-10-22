import classNames from 'classnames';

type CompactMetricCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'warning' | 'success';
  icon?: string;
};

export const CompactMetricCard = ({
  label,
  value,
  subtitle,
  trend,
  variant = 'default',
  icon
}: CompactMetricCardProps) => {
  return (
    <div className={classNames('compact-metric-card', `compact-metric-card--${variant}`)}>
      <div className="compact-metric-card__header">
        <span className="compact-metric-card__label">{label}</span>
        {trend && (
          <span className={classNames('compact-metric-card__trend', `compact-metric-card__trend--${trend}`)}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
          </span>
        )}
      </div>
      <div className="compact-metric-card__content">
        {icon && <span className="compact-metric-card__icon">{icon}</span>}
        <span className="compact-metric-card__value">{value}</span>
      </div>
      {subtitle && <span className="compact-metric-card__subtitle">{subtitle}</span>}
    </div>
  );
};
