import { MenuItem } from './Menu';
import {
  CircleHelp,
  HelpingHand,
  LogOut,
  UserCog,
  Users,
  ReceiptText,
  ToolCase,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

export const menuItems: MenuItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: <LayoutDashboard /> },
  {
    label: '管理',
    icon: <ToolCase />,
    children: [
      { label: '用户管理', href: '/users', icon: <Users /> },
      { label: '订单管理', href: '/orders', icon: <ClipboardList /> },
    ],
  },
];

export const footerItems: MenuItem[] = [
  { label: '设置', href: '#', icon: <UserCog /> },
  { label: '帮助', href: '#', icon: <HelpingHand /> },
  { label: '退出登录', href: '#', icon: <LogOut /> },
];
