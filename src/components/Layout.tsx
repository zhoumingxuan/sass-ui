'use client';

import { ReactNode } from 'react';
import Menu, { MenuItem } from './Menu';

export function Header({ children }: { children: ReactNode }) {
  return <div className="h-12 flex items-center px-4 border-b bg-white">{children}</div>;
}

export function Content({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-auto p-4 bg-bg">{children}</div>;
}

export default function Layout({
  header,
  menuItems,
  children,
}: {
  header?: ReactNode;
  menuItems: MenuItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Menu items={menuItems} />
      <div className="flex-1 flex flex-col">
        <Header>{header}</Header>
        <Content>{children}</Content>
      </div>
    </div>
  );
}
