import { ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import PlanBadge from './PlanBadge.tsx';
import Button from './Button.tsx';
import { IconChevronLeft, IconChevronRight, IconSearch, IconSettings, IconHelpCircle } from './icons.tsx';

type NavItem = {
  label: string;
  to: string;
  icon?: ReactNode;
  badge?: string | number;
  group?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  collapsed?: boolean;
};

type AppShellProps = {
  planTier: 'free' | 'pro';
  navItems: NavItem[];
  secondaryNavItems?: NavItem[];
  topBar?: ReactNode;
  footerNote?: ReactNode;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  onSignOut: () => Promise<void> | void;
  onSearch?: (query: string) => void;
  notifications?: number;
  children: ReactNode;
};

const AppShell = ({
  planTier,
  navItems,
  secondaryNavItems,
  topBar,
  footerNote,
  user,
  onSignOut,
  onSearch,
  notifications = 0,
  children
}: AppShellProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('rankai:nav-collapsed') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('rankai:nav-collapsed', collapsed ? 'true' : 'false');
  }, [collapsed]);

  const initials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'RA';
  }, [user]);

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const groupNavItems = (items: NavItem[]): NavGroup[] => {
    const workspaceItems = items.filter(item =>
      item.to === '/dashboard' || item.to.includes('/projects')
    );
    const analyticsItems = items.filter(item =>
      !item.to.includes('/projects') && item.to !== '/dashboard' && !item.to.includes('/settings') && !item.to.includes('/help')
    );

    const groups: NavGroup[] = [];

    if (workspaceItems.length > 0) {
      groups.push({
        label: 'Workspace',
        items: workspaceItems
      });
    }

    if (analyticsItems.length > 0) {
      groups.push({
        label: 'Analytics',
        items: analyticsItems
      });
    }

    return groups;
  };

  const navGroups = groupNavItems(navItems);

  return (
    <div className={classNames('app-shell', { 'is-collapsed': collapsed })} data-collapsed={collapsed}>
      <aside className="app-shell__rail" data-collapsed={collapsed}>
        {/* Enhanced Profile Section */}
        <div className="app-shell__profile-section">
          <button
            type="button"
            className="app-shell__collapse"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>

          <div className="app-shell__profile">
            <div className="app-shell__avatar-large" aria-hidden>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="app-shell__avatar-img" />
              ) : (
                <span className="app-shell__avatar-text">{initials}</span>
              )}
              {notifications > 0 && (
                <span className="app-shell__notification-badge">{notifications > 99 ? '99+' : notifications}</span>
              )}
            </div>
            {!collapsed && (
              <div className="app-shell__profile-meta">
                <span className="app-shell__profile-name">{user?.name ?? 'RankAI Operator'}</span>
                {user?.email && <span className="app-shell__profile-email">{user.email}</span>}
                <div className="app-shell__plan-info">
                  <PlanBadge tier={planTier} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="app-shell__search">
            <div className="app-shell__search-input">
              <IconSearch size={16} className="app-shell__search-icon" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="app-shell__search-field"
              />
            </div>
          </div>
        )}

        {/* Main Navigation Groups */}
        <nav className="app-shell__nav">
          {navGroups.map((group) => (
            <div key={group.label} className="app-shell__nav-group">
              <button
                type="button"
                className="app-shell__nav-group-toggle"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={!collapsedGroups.has(group.label)}
              >
                <span className="app-shell__nav-group-label">{group.label}</span>
                <IconChevronRight
                  size={14}
                  className={classNames('app-shell__nav-group-chevron', {
                    'is-rotated': !collapsedGroups.has(group.label)
                  })}
                />
              </button>

              {!collapsed && !collapsedGroups.has(group.label) && (
                <ul className="nav-list">
                  {group.items.map((item) => (
                    <li key={item.to} className="nav-list__item">
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => classNames('nav-list__link', { 'is-active': isActive })}
                      >
                        {item.icon && <span className="nav-list__icon" aria-hidden>{item.icon}</span>}
                        <span className="nav-list__text">{item.label}</span>
                        {item.badge && (
                          <span className="nav-list__badge">{item.badge}</span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="app-shell__rail-footer">
          {secondaryNavItems && secondaryNavItems.length > 0 && (
            <nav className="app-shell__nav app-shell__nav--secondary">
              <span className="app-shell__nav-label">Help & settings</span>
              <ul className="nav-list">
                {secondaryNavItems.map((item) => (
                  <li key={item.to} className="nav-list__item">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => classNames('nav-list__link', { 'is-active': isActive })}
                    >
                      {item.icon && <span className="nav-list__icon" aria-hidden>{item.icon}</span>}
                      <span className="nav-list__text">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {!collapsed && (
            <div className="app-shell__footer">
              <div className="app-shell__footer-note">
                {footerNote ?? 'Always-on visibility into AI-generated answers.'}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { void onSignOut(); }}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
      </aside>
      <div className="app-shell__main">
        {topBar && (
          <div className="app-shell__top-bar">
            {topBar}
          </div>
        )}
        <div className="app-shell__main-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
