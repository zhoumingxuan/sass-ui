'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { menuItems, footerItems } from '@/components/menuItems';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  TextInput,
  NumberInput,
  PasswordInput,
  SelectInput,
  DateInput,
  DateRangeInput,
} from '@/components/Input';
import Table, { Column } from '@/components/Table';
import Alert from '@/components/Alert';

export default function Home() {
  const columns: Column<{ name: string; age: number }>[] = [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
  ];
  const data = [
    { name: '张三', age: 28 },
    { name: '李四', age: 32 },
    { name: '王五', age: 26 },
    { name: '赵六', age: 30 },
  ];
  const pageSize = 2;
  const [page, setPage] = useState(1);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">Sass UI Demo</div>}
    >
      <Card title="按钮">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button size="large" variant="primary">
              大按钮
            </Button>
            <Button size="large" variant="default">
              大按钮
            </Button>
            <Button size="large" variant="success">
              大按钮
            </Button>
            <Button size="large" variant="warning">
              大按钮
            </Button>
            <Button size="large" variant="error">大按钮</Button>
            <Button size="large" variant="info">大按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">中按钮</Button>
            <Button variant="default">中按钮</Button>
            <Button variant="success">中按钮</Button>
            <Button variant="warning">中按钮</Button>
            <Button variant="error">中按钮</Button>
            <Button variant="info">中按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="small" variant="primary">
              小按钮
            </Button>
            <Button size="small" variant="default">
              小按钮
            </Button>
            <Button size="small" variant="success">
              小按钮
            </Button>
            <Button size="small" variant="warning">
              小按钮
            </Button>
            <Button size="small" variant="error">小按钮</Button>
            <Button size="small" variant="info">小按钮</Button>
          </div>
        </div>
      </Card>
      <Card title="输入">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 md:col-span-6">
            <TextInput label="文本输入" placeholder="请输入文本" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <NumberInput label="数字输入" placeholder="请输入数字" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <PasswordInput label="密码输入" placeholder="请输入密码" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <SelectInput
              label="选择输入"
              options={[{ value: '', label: '请选择' }, { value: '1', label: '选项1' }]}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <DateInput label="日期输入" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <DateRangeInput label="日期范围" />
          </div>
        </div>
      </Card>
      <Card title="表格">
        <Table
          columns={columns}
          data={paged}
          page={page}
          pageSize={pageSize}
          total={data.length}
          onPageChange={setPage}
        />
      </Card>
      <Card title="提示">
        <div className="flex flex-col space-y-3">
          <Alert variant="success">操作成功</Alert>
          <Alert variant="warning">警告信息</Alert>
          <Alert variant="error">错误信息</Alert>
          <Alert variant="info">提示信息</Alert>
        </div>
      </Card>
    </Layout>
  );
}
