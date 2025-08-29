'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export type MenuItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
  children?: MenuItem[];
};

function isDescendantActive(item: MenuItem, pathname: string): boolean {
  if (!item.children || item.children.length === 0) return false;
  return item.children.some((child) => {
    const match = child.href ? pathname.startsWith(child.href) : false;
    return match || isDescendantActive(child, pathname);
  });
}

function Item({
  item,
  depth = 0,
  collapsed,
}: {
  item: MenuItem;
  depth?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const active = item.href ? pathname.startsWith(item.href) : false;
  const shouldBeOpen = hasChildren && (active || isDescendantActive(item, pathname));
  const [open, setOpen] = useState<boolean>(shouldBeOpen);

  // Keep parents expanded when current route matches a child
  useEffect(() => {
    if (hasChildren) {
      setOpen(shouldBeOpen);
    }
  }, [pathname, hasChildren, shouldBeOpen]);
  const depthHover = depth > 0 ? 'hover:bg-nav-sub' : 'hover:bg-nav-hover';
  const depthText = depth > 0 ? 'text-nav-fg' : 'text-nav-fg-muted';
  // Tailwind-managed indentation per depth (no inline styles)
  const indentByDepth = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-[72px]', 'pl-[88px]'];
  const indentClass = indentByDepth[Math.min(depth, indentByDepth.length - 1)];
  // Increase vertical padding for level-1; slightly roomier for others
  const padY = depth === 0 ? 'py-3' : 'py-2.5';
  return (
    <div>
      <div
        className={`relative flex items-center gap-2 px-2 ${padY} cursor-pointer transition-colors ${
          active
            ? 'bg-nav-sub text-nav-fg before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary'
            : `${depthText} ${depthHover}`
        } ${indentClass}`}
        onClick={() => (hasChildren ? setOpen(!open) : undefined)}
        title={collapsed && depth === 0 ? item.label : undefined}
        aria-expanded={hasChildren ? open : undefined}
        role={hasChildren ? 'button' : undefined}
      >
        {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
        {!collapsed && <span className="truncate">{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>}
        {hasChildren && !collapsed && (
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        )}
      </div>
      {hasChildren && open && !collapsed && (
        <div className="space-y-0 bg-nav-deep">
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
      className={`flex flex-col h-screen border-r border-nav-deep bg-nav text-nav-fg transition-all ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center px-3 py-3 border-b border-nav-hover bg-nav/95">
        <span className="text-sm font-semibold">导航</span>
      </div>
      <div className="flex-1 overflow-auto space-y-0">
        {items.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
      <div className="mt-6 border-t border-nav-hover pt-4 space-y-0">
        {footerItems.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
