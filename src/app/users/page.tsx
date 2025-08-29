"use client";

import { ReactNode, useState } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Table, { Column } from '@/components/Table';
import { TextInput } from '@/components/Input';
import Breadcrumbs from '@/components/Breadcrumbs';
import Layout from '@/components/Layout';
import { menuItems, footerItems } from '@/components/menuItems';

interface UserRow {
  username: string;
  email: string;
  actions: ReactNode;
}

export default function Users() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const columns: Column<UserRow>[] = [
    { key: 'username', title: '用户名' },
    { key: 'email', title: '邮箱' },
    { key: 'actions', title: '操作' },
  ];

  const data: UserRow[] = [
    {
      username: '张三',
      email: 'zhang@example.com',
      actions: (
        <div className="flex gap-2">
          <Button appearance="ghost" variant="default" onClick={() => setShowEdit(true)}>
            修改
          </Button>
          <Button variant="error" onClick={() => setShowDelete(true)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">用户管理</div>}
    >
      <Breadcrumbs />
      <div className="mb-4 flex items-center justify-between">
        <h2>用户管理</h2>
        <Button onClick={() => setShowAdd(true)}>新增用户</Button>
      </div>
      <Table
        title="用户"
        columns={columns}
        data={data}
        page={1}
        pageSize={10}
        total={data.length}
        onPageChange={() => {}}
      />

      <Modal show={showAdd} title="新增用户" onClose={() => setShowAdd(false)}>
        <form className="flex flex-col gap-2">
          <TextInput placeholder="用户名" />
          <TextInput placeholder="邮箱" />
          <div className="flex justify-end">
            <Button onClick={() => setShowAdd(false)}>保存</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showEdit} title="修改用户" onClose={() => setShowEdit(false)}>
        <form className="flex flex-col gap-2">
          <TextInput defaultValue="张三" />
          <TextInput defaultValue="zhang@example.com" />
          <div className="flex justify-end">
            <Button onClick={() => setShowEdit(false)}>更新</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showDelete} title="删除用户" onClose={() => setShowDelete(false)}>
        <p className="mb-4">确定删除该用户吗？</p>
        <div className="flex justify-end">
          <Button variant="error" onClick={() => setShowDelete(false)}>
            删除
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

