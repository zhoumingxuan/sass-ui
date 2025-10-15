'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Tabs from '@/components/Tabs';
import { menuItems, footerItems } from '@/components/menuItems';
import { useEffect, useRef } from 'react';

export default function TabsDemo() {
  const longItems = Array.from({ length: 16 }).map((_, i) => ({
    key: `k${i + 1}`,
    label: `选项 ${i + 1}`,
    content: <div className="text-gray-700">这里是选项 {i + 1} 的内容。</div>,
  }));

  /** 把锚点分段插入 Tabs 的内部滚动容器（最小实现，不引入新的 prop/嵌套） */
  const anchorBodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const container = document.querySelector<HTMLDivElement>('[data-anchor-body]');
    if (container && anchorBodyRef.current) {
      container.replaceChildren(...Array.from(anchorBodyRef.current.children));
    }
  }, []);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">选项卡示例</div>}
    >
      <div className="space-y-10">
        {/* 1. 基础 tabs（line） */}
        <Card>
          <div className="text-base font-medium mb-3">基础（tabs · line）</div>
          <Tabs
            variant="line"
            items={[
              { key: 'a', label: '标签一', content: <div>内容一</div> },
              { key: 'b', label: '标签二', content: <div>内容二</div> },
              { key: 'c', label: '标签三', content: <div>内容三</div> },
            ]}
          />
        </Card>

        {/* 2. 大量标签（横向滚动，不平铺） */}
        <Card>
          <div className="text-base font-medium mb-3">大量标签（tabs · 横向滚动）</div>
          <Tabs  variant="line" items={longItems} />
        </Card>

        {/* 3. 锚点（内部滚动容器）—— Card 用相对高度，避免像素魔法数 */}
        <Card className="h-[60vh]">
          <div className="text-base font-medium mb-3">锚点模式（anchor · 内部滚动容器）</div>
          <div className="relative">
            <Tabs
              size="lg"
              variant="card"
              keepMounted={false}
              destroyInactive={true}
              onChange={(key) => console.log(`Active tab key: ${key}`)}
              items={[
                {
                  key: 'tab1',
                  label: 'Tab 1',
                  content: <div>Content of Tab 1</div>,
                },
                {
                  key: 'tab2',
                  label: 'Tab 2',
                  content: <div>Content of Tab 2</div>,
                },
                {
                  key: 'tab3',
                  label: 'Tab 3',
                  icon: <span role="img" aria-label="smile">😊</span>,
                  content: <div>Content of Tab 3</div>,
                },
              ]}
            />
          </div>
        </Card>
      </div>
    </Layout>
  );
}
