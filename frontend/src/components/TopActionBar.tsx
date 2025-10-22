import { ReactNode } from 'react';
import classNames from 'classnames';
import Button from './Button.tsx';
import { IconCalendar, IconFilter, IconRefreshCw, IconDownload } from './icons.tsx';

type DateRange = '7d' | '30d' | '90d' | '180d' | '1y' | 'custom';

type FilterOption = {
  id: string;
  label: string;
  active?: boolean;
  count?: number;
};

type TopActionBarProps = {
  title?: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    icon?: ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }>;
  dateRange?: {
    value: DateRange;
    onChange: (range: DateRange) => void;
    options?: { value: DateRange; label: string }[];
  };
  filters?: {
    options: FilterOption[];
    onToggle: (filterId: string) => void;
    onClearAll: () => void;
  };
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  loading?: boolean;
  className?: string;
};

const TopActionBar = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions = [],
  dateRange,
  filters,
  breadcrumbs,
  loading = false,
  className
}: TopActionBarProps) => {
  const activeFilterCount = filters?.options.filter(f => f.active).length || 0;

  return (
    <div className={classNames('top-action-bar', { 'top-action-bar--loading': loading }, className)}>
      <div className="top-action-bar__main">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="top-action-bar__breadcrumbs" aria-label="Breadcrumb">
            <ol className="top-action-bar__breadcrumb-list">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="top-action-bar__breadcrumb-item">
                  {index > 0 && (
                    <span className="top-action-bar__breadcrumb-separator" aria-hidden="true">
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <a href={crumb.href} className="top-action-bar__breadcrumb-link">
                      {crumb.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="top-action-bar__breadcrumb-button"
                      onClick={crumb.onClick}
                    >
                      {crumb.label}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title Section */}
        {(title || subtitle) && (
          <div className="top-action-bar__title-section">
            {title && <h1 className="top-action-bar__title">{title}</h1>}
            {subtitle && <p className="top-action-bar__subtitle">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="top-action-bar__actions">
        {/* Date Range Selector */}
        {dateRange && (
          <div className="top-action-bar__date-range">
            <div className="top-action-bar__select-wrapper">
              <IconCalendar size={16} className="top-action-bar__select-icon" />
              <select
                value={dateRange.value}
                onChange={(e) => dateRange.onChange(e.target.value as DateRange)}
                className="top-action-bar__select"
              >
                {(dateRange.options || [
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                  { value: '180d', label: 'Last 180 days' },
                  { value: '1y', label: 'Last year' },
                  { value: 'custom', label: 'Custom range' }
                ]).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Filters */}
        {filters && (
          <div className="top-action-bar__filters">
            <div className="top-action-bar__filter-trigger">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<IconFilter size={16} />}
                onClick={() => {}}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="top-action-bar__filter-count">{activeFilterCount}</span>
                )}
              </Button>
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="quiet"
                size="sm"
                onClick={filters.onClearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Secondary Actions */}
        {secondaryActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        ))}

        {/* Primary Action */}
        {primaryAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={primaryAction.onClick}
            loading={primaryAction.loading}
            leftIcon={primaryAction.icon}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="top-action-bar__loading-overlay" aria-hidden="true">
          <div className="top-action-bar__loading-spinner">
            <IconRefreshCw size={16} className="animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TopActionBar;