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
    <nav
      className="text-sm my-4 flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm text-gray-600"
      aria-label="breadcrumb"
    >
      <Link href="/">首页</Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={href} className="flex items-center gap-2">
            <span className="text-gray-400">/</span>
            <Link href={href}>{nameMap[seg] ?? seg}</Link>
          </span>
        );
      })}
    </nav>
  );
}
