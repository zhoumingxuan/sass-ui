'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import ActionLink from './ActionLink';

type Crumb = { title: ReactNode; href?: string };
type Props = {
  items?: Crumb[];
  separator?: ReactNode;
  routesMap?: Record<string, ReactNode>;
  homeHref?: string;
  homeTitle?: ReactNode;
  className?: string;
};

export default function Breadcrumbs({
  items,
  separator = '/',
  routesMap,
  homeHref = '/',
  homeTitle = '首页',
  className = '',
}: Props) {
  const pathname = usePathname();

  let computed: Crumb[];
  if (items && items.length) {
    computed = items.slice();
  } else {
    const segments = pathname.split('/').filter(Boolean);
    computed = segments.map((seg, i) => ({
      title: routesMap?.[seg] ?? seg,
      href: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }

  const lastIndex = computed.length - 1;

  return (
    <nav
      className={`text-sm my-4 flex items-center flex-wrap gap-2 bg-transparent p-0 rounded-none shadow-none text-gray-500 ${className}`}
      aria-label="breadcrumb"
    >
      <ActionLink href={homeHref} className="no-underline hover:underline hover:text-gray-700">
        {homeTitle}
      </ActionLink>
      {computed.map((item, i) => (
        <span key={`bc-${i}`} className="flex items-center gap-2">
          <span className="text-gray-400">{separator}</span>
          {i === lastIndex || !item.href ? (
            <span className="text-gray-900" aria-current="page">{item.title}</span>
          ) : (
            <ActionLink href={item.href} className="no-underline hover:underline hover:text-gray-700">
              {item.title}
            </ActionLink>
          )}
        </span>
      ))}
    </nav>
  );
}

