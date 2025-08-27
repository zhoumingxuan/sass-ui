import { MenuItem } from './Menu';
import {
  DashboardIcon,
  ToolsIcon,
  UserIcon,
  OrderIcon,
  SettingsIcon,
  HelpIcon,
  LogoutIcon,
} from './icons';

export const menuItems: MenuItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: <DashboardIcon /> },
  {
    label: '管理',
    icon: <ToolsIcon />,
    children: [
      { label: '用户管理', href: '/users', icon: <UserIcon /> },
      { label: '订单管理', href: '/orders', icon: <OrderIcon /> },
    ],
  },
];

export const footerItems: MenuItem[] = [
  { label: '设置', href: '#', icon: <SettingsIcon /> },
  { label: '帮助', href: '#', icon: <HelpIcon /> },
  { label: '退出登录', href: '#', icon: <LogoutIcon /> },
];
