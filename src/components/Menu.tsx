'use client';

import Link from 'next/link';
import { useState } from 'react';

export type MenuItem = {
  label: string;
  href?: string;
  children?: MenuItem[];
};

function Item({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  return (
    <div>
      <div
        className="p-2 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors text-gray-800"
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => (hasChildren ? setOpen(!open) : undefined)}
      >
        {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
      </div>
      {hasChildren && open && (
        <div>
          {item.children!.map((child, idx) => (
            <Item key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Menu({ items }: { items: MenuItem[] }) {
  return (
    <aside className="w-48 bg-primary/5 border-r border-gray-200 shadow-sm h-screen overflow-auto p-2 space-y-2">
      {items.map((item, idx) => (
        <Item key={idx} item={item} />
      ))}
    </aside>
  );
}
