'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Tabs from '@/components/Tabs';
import { menuItems, footerItems } from '@/components/menuItems';

export default function TabsDemo() {
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">选项卡示例</div>}
    >
      <Card>
        <Tabs
          items={[
            { key: 'a', label: '标签一', content: <div>内容一</div> },
            { key: 'b', label: '标签二', content: <div>内容二</div> },
            { key: 'c', label: '标签三', content: <div>内容三</div> },
          ]}
        />
      </Card>
    </Layout>
  );
}

