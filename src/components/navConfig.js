import { Home, Mic, BarChart3, User, ListMusic } from 'lucide-react';

/** Record is the 3rd of 5 items so the FAB sits in the center on the bottom bar. */
export const MAIN_NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/sessions', icon: ListMusic, label: 'Sessions' },
  { to: '/record', icon: Mic, label: 'Record', primary: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: User, label: 'Account' },
];
