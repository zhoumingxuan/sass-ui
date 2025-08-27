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
        className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors rounded-lg ${
          active
            ? 'bg-nav-hover text-white shadow-md'
            : 'text-gray-300 hover:bg-nav-hover hover:text-white'
        }`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => (hasChildren ? setOpen(!open) : undefined)}
        title={collapsed && depth === 0 ? item.label : undefined}
      >
        {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
        {!collapsed && <span>{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>}
      </div>
      {hasChildren && open && !collapsed && (
        <div className="mt-2 space-y-2">
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
  const [collapsed] = useState(false);
  return (
    <aside
      className={`flex flex-col h-screen border-r border-nav-deep bg-nav p-2 text-gray-200 transition-all ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex-1 overflow-auto space-y-2">
        {items.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
      <div className="pt-2 mt-2 border-t border-nav-hover space-y-2">
        {footerItems.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
