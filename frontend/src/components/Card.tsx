import { ReactNode, HTMLAttributes } from 'react';
import classNames from 'classnames';
import Button from './Button.tsx';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
type CardSize = 'sm' | 'md' | 'lg';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
  hoverable?: boolean;
  loading?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode[];
  compact?: boolean;
};

const Card = ({
  variant = 'default',
  size = 'md',
  hoverable = false,
  loading = false,
  header,
  footer,
  actions,
  compact = false,
  children,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={classNames('card', {
        'card--default': variant === 'default',
        'card--elevated': variant === 'elevated',
        'card--outlined': variant === 'outlined',
        'card--ghost': variant === 'ghost',
        'card--sm': size === 'sm',
        'card--md': size === 'md',
        'card--lg': size === 'lg',
        'card--hoverable': hoverable,
        'card--loading': loading,
        'card--compact': compact
      }, className)}
      {...props}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="card__loading-overlay" aria-hidden="true">
          <div className="card__loading-spinner">
            <svg viewBox="0 0 40 40" className="card__spinner">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="64"
                strokeDashoffset="16"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Card Header */}
      {header && (
        <header className="card__header">
          {header}
        </header>
      )}

      {/* Card Content */}
      <div className="card__content">
        {children}
      </div>

      {/* Card Actions */}
      {actions && actions.length > 0 && (
        <div className="card__actions">
          {actions.map((action, index) => (
            <div key={index} className="card__action">
              {action}
            </div>
          ))}
        </div>
      )}

      {/* Card Footer */}
      {footer && (
        <footer className="card__footer">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default Card;