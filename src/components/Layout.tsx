'use client';

import { ReactNode } from 'react';
import Menu, { MenuItem } from './Menu';

export function Header({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center px-6 h-header border-b border-gray-200 bg-white shadow-elevation-1">
      {children}
    </div>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-auto bg-bg px-6 py-6 nice-scrollbar relative">
      <div className="mx-auto max-w-screen-2xl space-y-6 min-h-full h-full relative">{children}</div>
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
      <div id="layout-body" className="flex-1 flex flex-col relative">
        <Header>{header}</Header>
        <Content>{children}</Content>
      </div>
    </div>
  );
}
