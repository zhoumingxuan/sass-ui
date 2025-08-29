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
  const depthHover = 'hover:bg-white/5';
  const depthText = depth > 0 ? 'text-nav-fg' : 'text-nav-fg-muted';
  // Tailwind-managed indentation per depth (no inline styles)
  const indentByDepth = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-[72px]', 'pl-[88px]'];
  const indentClass = indentByDepth[Math.min(depth, indentByDepth.length - 1)];
  // Increase vertical padding for level-1; slightly roomier for others
  const padY = depth === 0 ? 'py-3' : 'py-2.5';
  return (
    <div>
      <div
        className={`relative flex items-center gap-2 px-3 ${padY} cursor-pointer rounded-md transition-colors select-none ${
          active
            ? 'bg-primary/15 ring-1 ring-primary/30 text-nav-fg before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/80'
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
        <div className="space-y-1 mt-1 ml-1 pl-3">
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
      className={`flex flex-col h-screen border-r border-nav-hover/50 bg-nav-deep text-nav-fg transition-all select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center px-4 h-header border-b border-white/10 bg-nav-header backdrop-blur-md backdrop-saturate-150 shadow-md select-none">
        <span className="text-[15px] font-semibold tracking-wide text-nav-fg">导航</span>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain bg-nav-body px-2 py-3 space-y-1.5 nice-scrollbar sidebar-scroll scrollbar-stable pr-1">
        {items.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
      <div className="border-t border-white/10 bg-nav-footer backdrop-blur-md backdrop-saturate-150 px-2 py-3 space-y-1.5 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.35)]">
        {footerItems.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
