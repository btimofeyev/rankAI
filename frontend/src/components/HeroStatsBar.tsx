import type { ReactNode } from 'react';

type HeroStatsBarProps = {
  stats: {
    queriesMentioned: {
      value: string;
      label: string;
      trend?: 'up' | 'down' | 'stable' | 'new';
      delta?: string;
    };
    appearanceRate: {
      value: string;
      label: string;
      trend?: 'up' | 'down' | 'stable' | 'new';
      delta?: string;
    };
    avgPosition: {
      value: string;
      label: string;
      trend?: 'up' | 'down' | 'stable' | 'new';
      delta?: string;
    };
    topCompetitor: {
      value: string;
      label: string;
      subtext?: string;
    };
  };
};

function TrendIndicator({ trend, delta }: { trend?: 'up' | 'down' | 'stable' | 'new'; delta?: string }): ReactNode {
  if (!trend) return null;

  const icons = {
    up: '↑',
    down: '↓',
    stable: '→',
    new: '[NEW]'
  };

  const colors = {
    up: '#10b981',
    down: '#ef4444',
    stable: '#6b7280',
    new: '#6366f1'
  };

  return (
    <span style={{ color: colors[trend], fontSize: '0.875rem', marginLeft: '0.5rem', fontWeight: trend === 'new' ? '600' : 'normal' }}>
      {icons[trend]} {delta}
    </span>
  );
}

export function HeroStatsBar({ stats }: HeroStatsBarProps) {
  return (
    <div className="hero-stats-bar">
      <div className="hero-stat">
        <div className="hero-stat-value">
          {stats.queriesMentioned.value}
          <TrendIndicator trend={stats.queriesMentioned.trend} delta={stats.queriesMentioned.delta} />
        </div>
        <div className="hero-stat-label">{stats.queriesMentioned.label}</div>
      </div>

      <div className="hero-stat">
        <div className="hero-stat-value">
          {stats.appearanceRate.value}
          <TrendIndicator trend={stats.appearanceRate.trend} delta={stats.appearanceRate.delta} />
        </div>
        <div className="hero-stat-label">{stats.appearanceRate.label}</div>
      </div>

      <div className="hero-stat">
        <div className="hero-stat-value">
          {stats.avgPosition.value}
          <TrendIndicator trend={stats.avgPosition.trend} delta={stats.avgPosition.delta} />
        </div>
        <div className="hero-stat-label">{stats.avgPosition.label}</div>
      </div>

      <div className="hero-stat">
        <div className="hero-stat-value">{stats.topCompetitor.value}</div>
        <div className="hero-stat-label">{stats.topCompetitor.label}</div>
        {stats.topCompetitor.subtext && (
          <div className="hero-stat-subtext">{stats.topCompetitor.subtext}</div>
        )}
      </div>
    </div>
  );
}
