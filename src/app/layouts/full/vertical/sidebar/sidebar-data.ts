import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'aperture',
    route: '/dashboards/dashboard1',
  },
  {
    navCap: 'Master',
  },
  {
    displayName: 'Firm Master',
    iconName: 'building-store',
    route: '/master/firmmaster',
  },
  {
    displayName: 'Party Master',
    iconName: 'users',
    route: '/master/partymaster',
  },
  {
    displayName: 'Purchase Master',
    iconName: 'file-invoice',
    route: '/master/purchasemaster',
  },
  {
    displayName: 'Category Master',
    iconName: 'file-invoice',
    route: '/master/categorymaster',
  },
  {
    displayName: 'Sale Master',
    iconName: 'file-invoice',
    route: '/master/shellmaster',
  },
]