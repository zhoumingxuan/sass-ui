'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { MenuItem } from '@/components/Menu';
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
  const menuItems: MenuItem[] = [
    { label: '仪表盘', href: '/dashboard' },
    {
      label: '用户管理',
      children: [
        { label: '用户列表', href: '/users' },
        { label: '角色管理', href: '#' },
      ],
    },
    {
      label: '订单管理',
      children: [{ label: '订单列表', href: '/orders' }],
    },
  ];

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
    <Layout menuItems={menuItems} header={<div className="font-bold">Sass UI Demo</div>}>
      <Card title="按钮">
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary">主按钮</Button>
          <Button variant="default">默认按钮</Button>
          <Button variant="success">成功按钮</Button>
          <Button variant="warning">警告按钮</Button>
          <Button variant="error">错误按钮</Button>
          <Button variant="info">信息按钮</Button>
        </div>
      </Card>
      <Card title="输入">
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          <TextInput placeholder="文本输入" />
          <NumberInput placeholder="数字输入" />
          <PasswordInput placeholder="密码输入" />
          <SelectInput
            options={[{ value: '', label: '请选择' }, { value: '1', label: '选项1' }]}
          />
          <DateInput />
          <DateRangeInput />
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
        <div className="flex flex-col gap-2">
          <Alert variant="success">操作成功</Alert>
          <Alert variant="warning">警告信息</Alert>
          <Alert variant="error">错误信息</Alert>
          <Alert variant="info">提示信息</Alert>
        </div>
      </Card>
    </Layout>
  );
}
