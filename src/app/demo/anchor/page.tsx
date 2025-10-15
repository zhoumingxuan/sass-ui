'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Anchor from '@/components/Anchor';
import { menuItems, footerItems } from '@/components/menuItems';
import { useEffect, useRef } from 'react';

export default function AnchorDemo() {

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">锚点定位</div>}
    >
      <div className="space-y-10">
        {/* 1. 基础 tabs（line） */}
        <Card>
          <div className="text-base font-medium mb-3">基本</div>
          <Anchor className='min-h-[520px] max-h-[520px] h-[520px]' items={[
            { key: 'a', label: '标签一', content: <div className='bg-blue-200 min-h-[300px]'>内容一</div> },
            { key: 'b', label: '标签二', content: <div className='bg-green-200 min-h-[700px]'>内容二</div> },
            { key: 'c', label: '标签三', content: <div className='bg-red-200 min-h-[400px]'>内容三</div> },
          ]}>

          </Anchor>
        </Card>


      </div>
    </Layout>
  );
}
