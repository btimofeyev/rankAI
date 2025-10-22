import { ReactNode, HTMLAttributes } from 'react';
import classNames from 'classnames';

type DashboardGridProps = HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  stretch?: boolean;
  className?: string;
  children: ReactNode;
};

const DashboardGrid = ({
  columns = 2,
  gap = 'md',
  stretch = false,
  className,
  children,
  ...props
}: DashboardGridProps) => {
  return (
    <div
      className={classNames('dashboard-grid', {
        'dashboard-grid--1-col': columns === 1,
        'dashboard-grid--2-col': columns === 2,
        'dashboard-grid--3-col': columns === 3,
        'dashboard-grid--4-col': columns === 4,
        'dashboard-grid--gap-sm': gap === 'sm',
        'dashboard-grid--gap-md': gap === 'md',
        'dashboard-grid--gap-lg': gap === 'lg',
        'dashboard-grid--stretch': stretch
      }, className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default DashboardGrid;