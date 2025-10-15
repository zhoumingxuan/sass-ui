'use client';

import React, { ReactNode, useState, useCallback,useRef, BaseSyntheticEvent } from 'react';

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
  onChange?: (activeKey: Key) => void;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function Anchor({ items, className = '', onChange }: AnchorProps) {
  const [active, setActive] = useState<{
    activeKey?:Key,
    activeIndex?:number
  }>({
    activeIndex:0
  });

  const contentRef=useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (key: Key) => (e: React.MouseEvent) => {
      if(contentRef.current)
      {
         const el=contentRef.current.querySelector(`[role="item"][data-id="${key.toString()}"]`);
         if(el)
         {
            el.scrollIntoView({
              block:'start',
              behavior:'auto',
              inline:'nearest'
            })
         }
      }

      setActive({activeKey:key});
      onChange?.(key);
    },
    [onChange]
  );

  const handleScroll = useCallback((e: BaseSyntheticEvent) => {
    const container = e.target as HTMLDivElement;
    const scrollTop = container.scrollTop;
    const location = [];
    let offerset = 0;
    for (const child of container.children) {
      const middle_point_y = Math.trunc(offerset + child.clientHeight / 2);
      location.push(middle_point_y - scrollTop);
      offerset += child.clientHeight;
    }
    //总共能够滚动的距离
    let activeIndex = -1;
    for (let i = 0; i < location.length; i++) {
      if (location[i] > 0) {
        activeIndex = i;
        break;
      }
    }

    if (activeIndex !== -1) {
      setActive({
        activeIndex: activeIndex
      });

      onChange?.(items[activeIndex].key);
    }

  }, [onChange]);

  return (
    <div className={cx(className, 'grid grid-cols-[auto_1fr]')}>
      <div className="min-w-20 bg-gray-200 pr-px relative select-none">
        <div className="w-full h-full bg-white">
          {items.map((item,index) => {
            const isActive =
            (active?.activeKey != null && item.key === active.activeKey) ||
            (active?.activeIndex != null && index === active.activeIndex);

            return (
              <div className="pl-1" key={item.key}>
                <span
                  onMouseDown={handleSelect(item.key)}
                  className={cx(
                    'block w-full h-full pr-2 py-1 mr-2 text-right border-primary',
                    isActive && '   border-r-2 mr-0'
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div ref={contentRef} className='overflow-y-auto overflow-x-hidden h-full max-w-full w-full nice-scrollbar ml-2' onScroll={e=>{
        handleScroll(e);
      }}>
          {items.map((item,index)=>{
            return (
              <div key={item.key} data-id={item.key} role='item' className='grid grid-cols-1 grid-rows-1 w-full max-w-full'>
                 {item.content}
              </div>
            )
          })}
      </div>
    </div>
  );
}
