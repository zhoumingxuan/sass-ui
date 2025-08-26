'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, ReactNode } from 'react';

export type MenuItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
  children?: MenuItem[];
};

function Item({
  item,
  depth = 0,
  collapsed,
}: {
  item: MenuItem;
  depth?: number;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const active = item.href ? pathname.startsWith(item.href) : false;
  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-gray-800 hover:bg-primary/10 ${
          active ? 'bg-primary text-white border-l-4 border-primary' : ''
        }`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => (hasChildren ? setOpen(!open) : undefined)}
        title={collapsed && depth === 0 ? item.label : undefined}
      >
        {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
        {!collapsed && <span>{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>}
      </div>
      {hasChildren && open && !collapsed && (
        <div>
          {item.children!.map((child, idx) => (
            <Item key={idx} item={child} depth={depth + 1} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Menu({
  items,
  footerItems = [],
}: {
  items: MenuItem[];
  footerItems?: MenuItem[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`flex flex-col h-screen border-r border-gray-200 shadow-sm bg-[#f4f6f8] transition-all ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {items.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
      <div className="p-2 space-y-1 border-t border-gray-200">
        {footerItems.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
        <button
          className="w-full text-left p-2 rounded-lg hover:bg-primary/10"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </aside>
  );
}
