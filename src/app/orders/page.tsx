'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function Orders() {
  const [showMore, setShowMore] = useState(false);
  return (
    <div>
      <h2>订单查询</h2>
      <Card>
        <form className="flex flex-col gap-3">
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-2">
            <input className="p-2 border border-gray-300 rounded w-full" placeholder="订单号" />
            <input className="p-2 border border-gray-300 rounded w-full" placeholder="客户名" />
            <input className="p-2 border border-gray-300 rounded w-full" type="date" placeholder="日期从" />
            <input className="p-2 border border-gray-300 rounded w-full" type="date" placeholder="日期至" />
          </div>
          {showMore && (
            <>
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-2">
                <select className="p-2 border border-gray-300 rounded w-full">
                  <option>状态</option>
                </select>
                <input className="p-2 border border-gray-300 rounded w-full" type="number" placeholder="金额最小值" />
                <input className="p-2 border border-gray-300 rounded w-full" type="number" placeholder="金额最大值" />
              </div>
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-2">
                <input className="p-2 border border-gray-300 rounded w-full" placeholder="商品名称" />
                <input className="p-2 border border-gray-300 rounded w-full" placeholder="销售员" />
                <input className="p-2 border border-gray-300 rounded w-full" placeholder="地区" />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="default" onClick={() => setShowMore(!showMore)}>
              {showMore ? '隐藏高级' : '更多条件'}
            </Button>
            <Button type="submit">查询</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
