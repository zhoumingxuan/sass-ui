'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
const nameMap: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  orders: '订单查询',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="text-sm my-4" aria-label="breadcrumb">
      <Link href="/">首页</Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={href}>
            <span className="mx-2 text-gray-500">/</span>
            <Link href={href}>{nameMap[seg] ?? seg}</Link>
          </span>
        );
      })}
    </nav>
  );
}
