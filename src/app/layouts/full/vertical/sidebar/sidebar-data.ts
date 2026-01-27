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
    displayName: 'Purchase ',
    iconName: 'file-invoice',
    route: '/master/purchasemaster',
  },
  {
    displayName: 'Category Master',
    iconName: 'category',
    route: '/master/categorymaster',
  },
  {
    displayName: 'Sale Master',
    iconName: 'receipt-2',
    route: '/master/shellmaster',
  },
  {
    displayName: 'Warranty Master',
    iconName: 'shield-check',
    route: '/master/warrantymaster',
  },
  {
    displayName: 'Income/Expense',
    iconName: 'presentation-analytics',
     route: '/master/income-expense',
  },
  {
    displayName: 'Balance',
    iconName: 'wallet',
     route: '/master/balance',
  },
]