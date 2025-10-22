import { ReactNode } from 'react';
import {
  IconFolder,
  IconGrid,
  IconLifeBuoy,
  IconSettings
} from '../components/icons.tsx';

type NavigationItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

export const PRIMARY_NAV: NavigationItem[] = [
  { label: 'Overview', to: '/dashboard', icon: <IconGrid size={18} /> },
  { label: 'Projects', to: '/projects', icon: <IconFolder size={18} /> }
];

export const SUPPORT_NAV: NavigationItem[] = [
  { label: 'Help center', to: '/help', icon: <IconLifeBuoy size={18} /> },
  { label: 'Account settings', to: '/settings', icon: <IconSettings size={18} /> }
];

export type { NavigationItem };
