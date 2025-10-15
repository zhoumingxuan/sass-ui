'use client';

import React, { ReactNode, useState, useCallback, useRef, BaseSyntheticEvent, useMemo } from 'react';

type Key = string | number;

type AnchorItem = {
  key: Key;
  label: ReactNode;
  content?: ReactNode;
  icon?: ReactNode;
};

type AnchorProps = {
  items: AnchorItem[];
  className?: string;
  tailSpacer?: boolean;
  onChange?: (activeKey: Key) => void;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function Anchor({ items, className = '', onChange,tailSpacer}: AnchorProps) {
  const [active, setActive] = useState<{ activeKey?: Key; activeIndex?: number }>({
    activeIndex: 0,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const rafLock = useRef<number | null>(null);

  const handleSelect = useCallback(
    (key: Key) => (e: React.MouseEvent) => {
      // 严格保留你的 scrollIntoView 常量与行为
      if (contentRef.current) {
        const el = contentRef.current.querySelector(
          `[role="item"][data-id="${key.toString()}"]`
        ) as HTMLElement | null;
        if (el) {
          const parent = el.parentElement;
          if (parent) {
            let offerset = 0;
            for (const child of parent.children) {
              if (child === el) {
                break;
              }
              offerset+=child.clientHeight;
            }
            parent.scrollTo({top:offerset});
          }
        }
      }
      setActive((prev) => (prev.activeKey === key ? prev : { activeKey: key }));
      onChange?.(key);
    },
    [onChange]
  );

  const handleScroll = useCallback(
    (e: BaseSyntheticEvent) => {
      const container = e.target as HTMLDivElement;
      if (!container) return;

      // rAF 轻量节流：不改变结果，只减少高频触发
      if (rafLock.current) cancelAnimationFrame(rafLock.current);
      rafLock.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const location: number[] = [];
        let offerset = 0;

        // === 中点判定算法：与原实现保持一致 ===
        for (const child of container.children) {
          const middle_point_y = Math.trunc(offerset + child.clientHeight / 2);
          location.push(middle_point_y - scrollTop);
          offerset += child.clientHeight;
        }

        let activeIndex = -1;
        for (let i = 0; i < location.length; i++) {
          if (location[i] > 0) {
            activeIndex = i;
            break;
          }
        }

        if (activeIndex !== -1) {
          setActive({ activeIndex });
          onChange?.(items[activeIndex].key);
        }
      });
    },
    [items, onChange]
  );


  const tailSpaceHeight = useMemo(() => {
     if(items&&items.length>0&&contentRef.current&&tailSpacer)
     {
        const container=contentRef.current;
        const last_item=container.children[container.children.length-2];
        const space=container.clientHeight-last_item.clientHeight;
        return space;
     }

     return 0;

  }, [items,contentRef.current,tailSpacer]);

  return (
    <div className={cx(className, 'grid grid-cols-[auto_1fr]')}>
      <div className="min-w-20 bg-gray-200 pr-px relative select-none">
        <div className="w-full h-full bg-white">
          {items.map((item, index) => {
            const isActive =
              (active?.activeKey != null && item.key === active.activeKey) ||
              (active?.activeIndex != null && index === active.activeIndex);

            return (
              <div className="pl-1" key={item.key}>
                <span
                  onMouseDown={handleSelect(item.key)}
                  className={cx(
                    'block w-full h-full pr-2 py-1 mr-2 text-right border-primary',
                    isActive && 'border-r-2 mr-0'
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={contentRef}
        tabIndex={0}
        className="overflow-y-auto overflow-x-hidden h-full max-w-full w-full nice-scrollbar ml-2 outline-none"
        onScroll={handleScroll}
      >
        {items.map((item) => {
          return (
            <div
              key={item.key}
              data-id={item.key}
              role="item"
              className="grid grid-cols-1 grid-rows-1 w-full max-w-full"
            >
              {item.content}
            </div>
          );
        })}
        <div className='w-full' style={{height:tailSpaceHeight}}>

        </div>
      </div>
    </div>
  );
}
