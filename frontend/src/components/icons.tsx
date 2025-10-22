type IconProps = {
  size?: number;
  strokeWidth?: number;
};

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg'
} as const;

export const IconGrid = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.4" />
    <rect x="14" y="3" width="7" height="7" rx="1.4" />
    <rect x="3" y="14" width="7" height="7" rx="1.4" />
    <rect x="14" y="14" width="7" height="7" rx="1.4" />
  </svg>
);

export const IconFolder = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h4l2 2h10a1 1 0 0 1 1 1v9.5A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11A1.5 1.5 0 0 1 4.5 6Z" />
  </svg>
);

export const IconLifeBuoy = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M15.5 15.5 18 18" />
    <path d="M6 6l2.5 2.5" />
    <path d="M6 18l2.5-2.5" />
    <path d="M18 6l-2.5 2.5" />
  </svg>
);

export const IconSettings = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const IconSearch = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconPlay = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconRefresh = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const IconBell = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const IconSparkle = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="m5.6 5.6 2.1 2.1" />
    <path d="m16.3 16.3 2.1 2.1" />
    <path d="m5.6 18.4 2.1-2.1" />
    <path d="m16.3 7.7 2.1-2.1" />
  </svg>
);

export const IconChevronLeft = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const IconChevronRight = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconFilter = ({ size = 18, strokeWidth = 1.7 }: IconProps = {}) => (
  <svg width={size} height={size} {...base} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" />
    <path d="M7 12h10" />
    <path d="M10 17h4" />
  </svg>
);
