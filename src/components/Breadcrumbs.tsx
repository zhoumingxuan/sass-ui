'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Breadcrumbs.module.scss';

const nameMap: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  orders: '订单查询',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className={styles.breadcrumbs} aria-label="breadcrumb">
      <Link href="/">首页</Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={href}>
            <span className={styles.separator}>/</span>
            <Link href={href}>{nameMap[seg] ?? seg}</Link>
          </span>
        );
      })}
    </nav>
  );
}
