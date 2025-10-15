'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Anchor from '@/components/Anchor';
import { menuItems, footerItems } from '@/components/menuItems';

function Block({
  title,
  minH,
  bg,
  text = '',
}: {
  title: string;
  minH: number;
  bg: string;
  text?: string;
}) {
  return (
    <div className={`${bg} min-h-[${minH}px] p-4`}>
      <div className="text-lg font-medium mb-2">{title}</div>
      <p className="text-gray-700">
        {text ||
          '用于测试锚点在不同高度内容块下的中点判定表现。上下滚动观察左侧高亮与滚动位置的联动是否稳定、无抖动。'}
      </p>
    </div>
  );
}

export default function AnchorDemo() {
  const itemsBasic = [
    { key: 'a', label: '概览', content: <Block title="概览" minH={320} bg="bg-blue-200" /> },
    { key: 'b', label: '明细', content: <Block title="明细" minH={720} bg="bg-green-200" /> },
    { key: 'c', label: '结论', content: <Block title="结论" minH={420} bg="bg-red-200" /> },
  ];

  const itemsMany = Array.from({ length: 10 }).map((_, i) => {
    const pool = ['bg-indigo-200', 'bg-emerald-200', 'bg-amber-200', 'bg-sky-200', 'bg-rose-200', 'bg-lime-200'];
    const heights = [360, 520, 400, 640, 300, 560, 380, 600, 340, 480];
    return {
      key: `m-${i + 1}`,
      label: `章节${i + 1}`,
      content: <Block title={`章节 ${i + 1}`} minH={heights[i]} bg={pool[i % pool.length]} />,
    };
  });

  const itemsExtreme = [
    { key: 'x-1', label: '短块', content: <Block title="短块" minH={220} bg="bg-amber-200" /> },
    { key: 'x-2', label: '超长块', content: <Block title="超长块" minH={1200} bg="bg-sky-200" /> },
    { key: 'x-3', label: '短块', content: <Block title="短块" minH={240} bg="bg-emerald-200" /> },
    { key: 'x-4', label: '较长块', content: <Block title="较长块" minH={800} bg="bg-rose-200" /> },
  ];

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">锚点定位</div>}
    >
      <div className="space-y-10">
        <Card>
          <div className="text-base font-medium mb-3">基础示例（3 段）</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsBasic} />
        </Card>

        <Card>
          <div className="text-base font-medium mb-3">多章节（10 段）</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsMany} tailSpacer />
        </Card>

        <Card>
          <div className="text-base font-medium mb-3">极端高度混排</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsExtreme} />
        </Card>
      </div>
    </Layout>
  );
}
