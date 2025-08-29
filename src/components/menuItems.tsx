import { MenuItem } from './Menu';
import {
  HelpingHand,
  LogOut,
  UserCog,
  Users,
  ReceiptText,
  ToolCase,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';

export const menuItems: MenuItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: <LayoutDashboard /> },
  {
    label: '管理',
    icon: <ToolCase />,
    children: [
      { label: '用户管理', href: '/users', icon: <Users /> },
      { label: '订单管理', href: '/orders', icon: <ClipboardList /> },
      { label: '角色管理', href: '/roles' },
      { label: '权限管理', href: '/permissions' },
      { label: '部门管理', href: '/departments' },
      { label: '岗位管理', href: '/positions' },
      { label: '菜单管理', href: '/menus' },
      { label: '字典管理', href: '/dicts' },
      { label: '参数设置', href: '/settings' },
      { label: '任务调度', href: '/jobs' },
      { label: '通知公告', href: '/notices' },
      { label: '操作日志', href: '/op-logs' },
      { label: '登录日志', href: '/login-logs' },
      { label: '缓存监控', href: '/cache' },
      { label: '服务监控', href: '/monitor' },
      { label: '在线用户', href: '/online' },
    ],
  },
  {
    label: '报表',
    icon: <ReceiptText />,
    children: [
      { label: '销售报表', href: '/reports/sales' },
      { label: '客户报表', href: '/reports/customers' },
      { label: '库存报表', href: '/reports/inventory' },
      { label: '财务报表', href: '/reports/finance' },
    ],
  },
];

export const footerItems: MenuItem[] = [
  { label: '设置', href: '#', icon: <UserCog /> },
  { label: '帮助', href: '#', icon: <HelpingHand /> },
  { label: '退出登录', href: '#', icon: <LogOut /> },
];

