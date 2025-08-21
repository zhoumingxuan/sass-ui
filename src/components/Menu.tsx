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
        className="p-2 cursor-pointer hover:bg-gray-100"
        style={{ paddingLeft: depth * 16 }}
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
    <aside className="w-48 bg-white border-r h-screen overflow-auto">
      {items.map((item, idx) => (
        <Item key={idx} item={item} />
      ))}
    </aside>
  );
}
