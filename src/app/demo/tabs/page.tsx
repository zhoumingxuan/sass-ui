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
            mode="tabs"
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
          <Tabs mode="tabs" variant="line" items={longItems} />
        </Card>

        {/* 3. 锚点（内部滚动容器）—— Card 用相对高度，避免像素魔法数 */}
        <Card className="h-[60vh]">
          <div className="text-base font-medium mb-3">锚点模式（anchor · 内部滚动容器）</div>
          <div className="relative">
            <Tabs
              mode="anchor"
              variant="line"
              items={[
                { key: 's1', href: '#section-overview', title: '概览' },
                { key: 's2', href: '#section-monitor', title: '监控' },
                { key: 's3', href: '#section-tasks', title: '任务' },
                { key: 's4', href: '#section-audit', title: '审计日志', replace: true },
              ]}
            />
            {/* 这个占位节点只为把分段内容“塞”进 Tabs 的内部滚动容器；渲染完成后会被搬运进去 */}
            <div ref={anchorBodyRef} hidden>
              <section id="section-overview" className="anchor-section min-h-full">
                <div className="text-lg font-semibold mb-2">概览</div>
                <div className="bg-gray-50 rounded-md border border-gray-200 p-4 min-h-[50%]"></div>
              </section>

              <section id="section-monitor" className="anchor-section min-h-full">
                <div className="text-lg font-semibold mb-2">监控</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-40 bg-gray-50 rounded-md border border-gray-200" />
                  <div className="h-64 bg-gray-50 rounded-md border border-gray-200" />
                </div>
              </section>

              <section id="section-tasks" className="anchor-section min-h-full">
                <div className="text-lg font-semibold mb-2">任务</div>
                <div className="bg-gray-50 rounded-md border border-gray-200 p-4 min-h-[60%]" />
              </section>

              <section id="section-audit" className="anchor-section min-h-full">
                <div className="text-lg font-semibold mb-2">审计日志</div>
                <div className="bg-gray-50 rounded-md border border-gray-200 p-4 min-h-[60%]" />
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
