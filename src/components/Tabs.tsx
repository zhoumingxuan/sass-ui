'use client';

import React, { ReactNode, useRef, useState, useCallback, useEffect } from 'react';

type BaseItem = {
  key: string;
  disabled?: boolean;
};

/** Tabs 模式下的条目（对齐 antd Tabs 的 items 语义：label/key/children） */
type TabItem = BaseItem & {
  label?: ReactNode;          // 选项卡标题
  content?: ReactNode;        // 面板内容（等价 antd items[i].children）
};

/** Anchor 模式下的条目（对齐 antd Anchor AnchorItem/Link Props） */
type AnchorItem = BaseItem & {
  href?: string;              // #section-id（推荐）
  /** 兼容旧写法：给了 anchorId 也能跑；内部会转成 href */
  anchorId?: string;          // 'section-id'
  title?: ReactNode;          // 展示文案（与 label 等价）
  label?: ReactNode;          // 兼容：如果写了 label 也可作为标题
  target?: string;            // a 的 target
  replace?: boolean;          // 是否 replaceState（而不是 pushState）
};

type TabsProps = {
  items: Array<TabItem | AnchorItem>;
  className?: string;
  /** 视觉风格（非 antd 原生，只做样式映射） */
  variant?: 'line' | 'card' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  /** 工作模式：普通选项卡 / 锚点 */
  mode?: 'tabs' | 'anchor';
  /** tabs: 是否保留未激活面板挂载；与 antd 的 destroyOnHidden 含义接近 */
  keepMounted?: boolean;
  /** tabs: 切换时销毁未激活面板 */
  destroyInactive?: boolean;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

export default function Tabs({
  items,
  className = '',
  variant = 'line',
  size = 'md',
  mode = 'tabs',
  keepMounted = false,
  destroyInactive = true,
}: TabsProps) {
  const firstKey = items.find((i) => !i.disabled)?.key ?? items[0]?.key;
  const [active, setActive] = useState<string | undefined>(firstKey);

  /** 仅 anchor 使用：内部滚动容器 */
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /** 视觉尺寸 */
  const sizeCls =
    {
      sm: 'h-8 text-xs px-2.5',
      md: 'h-9 text-sm px-3',
      lg: 'h-10 text-base px-3.5',
    }[size] ?? 'h-9 text-sm px-3';

  const navBase =
    variant === 'line'
      ? 'border-b border-gray-200'
      : variant === 'card'
      ? 'border-b border-gray-200 bg-white'
      : 'bg-gray-100 rounded-md p-1';

  const itemCls = (isActive: boolean, disabled?: boolean) =>
    cx(
      'relative whitespace-nowrap truncate select-none',
      sizeCls,
      disabled && 'opacity-40 pointer-events-none',
      variant === 'line' &&
        (isActive
          ? 'text-primary border-b-2 border-primary'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'),
      variant === 'card' &&
        (isActive
          ? 'text-primary bg-white border border-gray-200 rounded-t-md'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-t-md'),
      variant === 'pill' &&
        (isActive ? 'text-white bg-primary rounded-md' : 'text-gray-800 hover:bg-gray-200 rounded-md'),
    );

  const isAnchorMode = mode === 'anchor';

  /** ======== 通用：导航点击 ======== */
  const onNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, it: TabItem | AnchorItem) => {
      if (it.disabled) {
        e.preventDefault();
        return;
      }
      setActive(it.key);

      if (isAnchorMode && scrollRef.current) {
        e.preventDefault();

        const href =
          (it as AnchorItem).href ??
          ((it as AnchorItem).anchorId ? `#${(it as AnchorItem).anchorId}` : undefined);
        const targetId = href?.startsWith('#') ? href.slice(1) : href;

        if (targetId) {
          const target = scrollRef.current.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // 按 antd Anchor 语义更新 URL（push/replace），不触发整页滚动
          try {
            const base = window.location.pathname + window.location.search;
            const next = `${base}#${targetId}`;
            (it as AnchorItem).replace
              ? window.history.replaceState(null, '', next)
              : window.history.pushState(null, '', next);
          } catch {
            /* 忽略历史 API 失败 */
          }
        }
      } else {
        e.preventDefault(); // tabs 不跳转
      }
    },
    [isAnchorMode],
  );

  /** ========== 普通 tabs：面板切换 ========== */
  if (!isAnchorMode) {
    const activeItem = items.find((i) => i.key === active) as TabItem | undefined;

    return (
      <div className={className}>
        <div className={cx('flex items-end gap-2 overflow-x-auto no-scrollbar', navBase)}>
          {items.map((it) => {
            const isActive = it.key === active;
            const label = (it as TabItem).label ?? (it as any).title;
            return (
              <a
                key={it.key}
                href="#"
                onClick={(e) => onNavClick(e, it)}
                className={itemCls(isActive, it.disabled)}
              >
                <span className="inline-block">{label}</span>
              </a>
            );
          })}
        </div>

        <div
          className={cx(
            variant === 'card'
              ? 'bg-white border border-gray-200 rounded-b-md rounded-tr-md p-4'
              : variant === 'pill'
              ? 'mt-3'
              : 'p-4 bg-white border border-gray-200 rounded-md',
          )}
        >
          {keepMounted
            ? items.map((it) => (
                <div key={it.key} hidden={it.key !== active}>
                  {(it as TabItem).content}
                </div>
              ))
            : items
                .filter(
                  (it) => it.key === activeItem?.key || (!destroyInactive && it.key !== activeItem?.key),
                )
                .map((it) => <div key={it.key}>{(it as TabItem).content}</div>)}
        </div>
      </div>
    );
  }

  /** ========== 锚点模式：内部单页 + 内滚动条（最小实现） ========== */

  // 解析 anchor items（兼容 anchorId 写法）
  const anchorItems = (items as AnchorItem[]).map((it) => {
    const href = it.href ?? (it.anchorId ? `#${it.anchorId}` : undefined);
    const title = it.title ?? (it as any).label;
    return { ...it, href, title };
  });

  // 从 CSS 变量读取“吸顶”偏移，避免写死像素
  const getStickyOffset = () => {
    try {
      const root = getComputedStyle(document.documentElement);
      const v = root.getPropertyValue('--tabs-sticky-top').trim();
      const n = parseInt(v || '0', 10);
      return Number.isFinite(n) ? n + 8 : 0; // +8 对应 .anchor-section 的额外间距
    } catch {
      return 0;
    }
  };

  // 简单 scrollspy：找出“顶部之上或刚进入”的最后一个 section
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    const ids = anchorItems
      .map((it) => (it.href?.startsWith('#') ? it.href.slice(1) : it.href))
      .filter(Boolean) as string[];

    const offset = () => getStickyOffset();

    const computeActive = () => {
      if (!el) return;
      const off = offset();
      let currentKey: string | undefined = anchorItems[0]?.key;

      for (const it of anchorItems) {
        const id = it.href?.startsWith('#') ? it.href.slice(1) : it.href;
        if (!id) continue;
        const sec = el.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
        if (!sec) continue;

        const top = sec.offsetTop - el.scrollTop - off;
        // 顶部阈值以内视为“到达”，取最后一个满足条件的
        if (top <= 1) currentKey = it.key;
      }
      if (currentKey && currentKey !== active) setActive(currentKey);
    };

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeActive);
    };

    // 初次也跑一次（等内容搬进来后）
    computeActive();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]); // items 变更时重建

  return (
    <div className={cx('w-full h-full', className)}>
      {/* 导航：简洁，不造花里胡哨的边框 */}
      <div className={cx('flex items-end gap-2 px-3 overflow-x-auto no-scrollbar', navBase)}>
        {anchorItems.map((it) => {
          const isActive = it.key === active;
          const label = it.title ?? it.label;
          const href = it.href ?? '#';
          return (
            <a
              key={it.key}
              href={href}
              target={it.target}
              onClick={(e) => onNavClick(e, it)}
              className={itemCls(isActive, it.disabled)}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="inline-block">{label}</span>
            </a>
          );
        })}
      </div>

      {/* 内部滚动页：填满父容器；标 data-anchor-body，便于把各 section 搬进来 */}
      <div
        ref={scrollRef}
        data-anchor-body
        className="h-[calc(100%-1px)] overflow-auto bg-white border border-gray-200 rounded-b-md p-4"
      />
    </div>
  );
}
