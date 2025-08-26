import { MenuItem } from './Menu';

export const menuItems: MenuItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: '📊' },
  {
    label: '管理',
    icon: '🛠️',
    children: [
      { label: '用户管理', href: '/users', icon: '👤' },
      { label: '订单管理', href: '/orders', icon: '🧾' },
    ],
  },
];

export const footerItems: MenuItem[] = [
  { label: '设置', href: '#', icon: '⚙️' },
  { label: '帮助', href: '#', icon: '❓' },
  { label: '退出登录', href: '#', icon: '🚪' },
];
