'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

export default function Users() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>用户管理</h2>
        <Button onClick={() => setShowAdd(true)}>新增用户</Button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border-b bg-gray-50 text-left">用户名</th>
            <th className="p-2 border-b bg-gray-50 text-left">邮箱</th>
            <th className="p-2 border-b bg-gray-50 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">张三</td>
            <td className="p-2 border-b">zhang@example.com</td>
            <td className="p-2 border-b">
              <div className="flex gap-2">
                <Button variant="default" onClick={() => setShowEdit(true)}>修改</Button>
                <Button variant="error" onClick={() => setShowDelete(true)}>删除</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <Modal show={showAdd} title="新增用户" onClose={() => setShowAdd(false)}>
        <form className="flex flex-col">
          <input className="p-2 border border-gray-300 rounded mb-2" placeholder="用户名" />
          <input className="p-2 border border-gray-300 rounded mb-2" placeholder="邮箱" />
          <div className="flex justify-end">
            <Button onClick={() => setShowAdd(false)}>保存</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showEdit} title="修改用户" onClose={() => setShowEdit(false)}>
        <form className="flex flex-col">
          <input className="p-2 border border-gray-300 rounded mb-2" defaultValue="张三" />
          <input className="p-2 border border-gray-300 rounded mb-2" defaultValue="zhang@example.com" />
          <div className="flex justify-end">
            <Button onClick={() => setShowEdit(false)}>更新</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showDelete} title="删除用户" onClose={() => setShowDelete(false)}>
        <p>确定删除该用户吗？</p>
        <div className="flex justify-end">
          <Button variant="error" onClick={() => setShowDelete(false)}>删除</Button>
        </div>
      </Modal>
    </div>
  );
}
