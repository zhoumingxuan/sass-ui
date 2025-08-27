'use client';

import { ReactNode } from 'react';
import Menu, { MenuItem } from './Menu';

export function Header({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center px-6 py-2 border-b border-gray-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-auto bg-bg px-6 py-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">{children}</div>
    </div>
  );
}

export default function Layout({
  header,
  menuItems,
  footerItems,
  children,
}: {
  header?: ReactNode;
  menuItems: MenuItem[];
  footerItems?: MenuItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-bg">
      <Menu items={menuItems} footerItems={footerItems} />
      <div className="flex-1 flex flex-col">
        <Header>{header}</Header>
        <Content>{children}</Content>
      </div>
    </div>
  );
}
