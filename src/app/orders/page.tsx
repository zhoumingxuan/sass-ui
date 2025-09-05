'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Grid from '@/components/Grid';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  TextInput,
  NumberInput,
  SelectInput,
  DateInput,
} from '@/components/Input';
import Layout from '@/components/Layout';
import { menuItems, footerItems } from '@/components/menuItems';

export default function Orders() {
  const [showMore, setShowMore] = useState(false);
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">订单管理</div>}
    >
      <Breadcrumbs />
      <h2 className="mb-4">订单查询</h2>
      <Card>
        <form className="flex flex-col gap-4">
          <Grid cols={4} gap={2} className="max-md:grid-cols-2">
            <TextInput placeholder="订单号" />
            <TextInput placeholder="客户名" />
            <DateInput disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6} />
            <DateInput disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6} />
          </Grid>
          {showMore && (
            <>
              <Grid cols={3} gap={2} className="max-md:grid-cols-2">
                <SelectInput options={[{ value: '', label: '状态' }]} />
                <NumberInput placeholder="金额最小值" />
                <NumberInput placeholder="金额最大值" />
              </Grid>
              <Grid cols={3} gap={2} className="max-md:grid-cols-2">
                <TextInput placeholder="商品名称" />
                <TextInput placeholder="销售员" />
                <TextInput placeholder="地区" />
              </Grid>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" appearance="link" variant="default" onClick={() => setShowMore(!showMore)}>
              {showMore ? '隐藏高级' : '更多条件'}
            </Button>
            <Button type="submit">查询</Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
