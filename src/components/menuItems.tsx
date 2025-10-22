import { MenuItem } from './Menu';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  PanelsTopLeft,
  FlaskConical,
  Table as TableIcon,
  FormInput,
  CreditCard,
  LayoutList,
  MessageSquareText,
  LogOut,
  UserCog,
  HelpingHand,
  FolderOpenDot,
  Search,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react';

export const menuItems: MenuItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: <LayoutDashboard /> },
  {
    label: '管理',
    icon: <PanelsTopLeft />,
    children: [
      { label: '用户管理', href: '/users', icon: <Users /> },
      { label: '订单管理', href: '/orders', icon: <ClipboardList /> },
    ],
  },
  {
    label: '示例',
    icon: <FlaskConical />,
    children: [
      { label: '按钮', href: '/demo/buttons', icon: <FolderOpenDot /> },
      { label: '界面元素', href: '/demo/elements', icon: <Sparkles /> },
      { label: '选择器 Select', href: '/demo/select', icon: <FormInput /> },
      { label: '穿梭选择 Transfer', href: '/demo/transfer-select', icon: <ArrowLeftRight /> },
      { label: '表格', href: '/demo/table', icon: <TableIcon /> },
      { label: '表单', href: '/demo/form', icon: <FormInput /> },
      { label: '卡片', href: '/demo/card', icon: <CreditCard /> },
      { label: '选项卡', href: '/demo/tabs', icon: <LayoutList /> },
      { label: '锚点', href: '/demo/anchor', icon: <LayoutList /> },
      { label: '模态框', href: '/demo/modal', icon: <PanelsTopLeft /> },
      { label: '树组件', href: '/demo/tree', icon: <LayoutList /> },
      { label: '抽屉', href: '/demo/drawer', icon: <PanelsTopLeft /> },
      { label: '消息提示', href: '/demo/message', icon: <MessageSquareText /> },
      { label: '超级搜索', href: '/demo/supersearch', icon: <Search /> },
      { label: '风控配置', href: '/demo/risk-control', icon: <ShieldCheck /> },
      { label: '运维流程', href: '/demo/runbook', icon: <ClipboardList /> },
    ],
  },
];

export const footerItems: MenuItem[] = [
  { label: '设置', href: '#', icon: <UserCog /> },
  { label: '帮助', href: '#', icon: <HelpingHand /> },
  { label: '退出登录', href: '#', icon: <LogOut /> },
];
