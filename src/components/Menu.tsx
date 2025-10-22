'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode, useRef } from 'react';
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
  const hasChildren: boolean = !!(item.children && item.children.length > 0);
  const active = item.href ? pathname.startsWith(item.href) : false;
  const shouldBeOpen: boolean = hasChildren && (active || isDescendantActive(item, pathname));
  const [open, setOpen] = useState<boolean>(shouldBeOpen);
  const menuRef=useRef<HTMLDivElement>(null);

  // Keep parents expanded when current route matches a child
  useEffect(() => {
    if (hasChildren) {
      setOpen(shouldBeOpen);
    }
  }, [pathname, hasChildren, shouldBeOpen]);

  useEffect(()=>{
     if(menuRef.current&&item.href&&window.location.pathname===item.href)
     {
         menuRef.current.scrollIntoView({
            block:'nearest',
            inline:'nearest',
            behavior:'smooth'
         });
     }
  },[menuRef.current]);

  const depthHover = 'hover:bg-white/5';
  const depthText = depth > 0 ? 'text-nav-fg' : 'text-nav-fg-muted';
  // Tailwind-managed indentation per depth（8px 栅格，收敛到常规刻度）
  const indentByDepth = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-16', 'pl-16'];
  const indentClass = indentByDepth[Math.min(depth, indentByDepth.length - 1)];
  // Increase vertical padding for level-1; slightly roomier for others
  const padY = depth === 0 ? 'py-3' : 'py-2.5';
  const containerClasses = `relative flex w-full items-center gap-2 px-3 ${padY} rounded-md transition-colors select-none ${
    active
      ? 'bg-primary/15 ring-1 ring-primary/30 text-primary text-nav-fg before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/80'
      : `${depthText} ${depthHover}`
  } ${indentClass}`;
  return (
    <div ref={menuRef} className="w-full">
      {hasChildren ? (
        <div
          className={`${containerClasses} cursor-pointer`}
          onClick={() => setOpen(!open)}
          title={collapsed && depth === 0 ? item.label : undefined}
          aria-expanded={open}
          role="button"
        >
          {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
          {!collapsed && <span className="truncate">{item.label}</span>}
          {hasChildren && !collapsed && (
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          )}
        </div>
      ) : item.href ? (
        <Link
          href={item.href}
          role='nav'
          data-href={item.href}
          className={`${containerClasses} cursor-pointer`}
          title={collapsed && depth === 0 ? item.label : undefined}
          aria-current={active ? 'page' : undefined}
        >
          {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      ) : (
        <div
          className={`${containerClasses} cursor-default`}
          title={collapsed && depth === 0 ? item.label : undefined}
        >
          {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>
      )}
      {hasChildren && open && !collapsed && (
        <div className="mt-1 space-y-1 w-full">
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
      className={`relative z-20 isolate flex flex-col h-screen border-r border-gray-200 text-nav-fg transition-all shadow-elevation-2-right select-none 
        ${collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'}`}
    >
      <div className="sticky top-0 z-10 flex items-center px-4 h-header bg-nav backdrop-blur-md backdrop-saturate-150 border-b border-gray-200 select-none">
        <span className="text-sm font-semibold tracking-wide text-nav-fg">导航</span>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain bg-nav/80 px-2 py-3 space-y-1.5 nice-scrollbar sidebar-scroll pr-1">
        {items.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
      <div className="border-t border-gray-200 bg-nav backdrop-blur-md backdrop-saturate-150 px-2 py-3 space-y-1.5">
        {footerItems.map((item, idx) => (
          <Item key={idx} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
