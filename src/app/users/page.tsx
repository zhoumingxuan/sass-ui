'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import styles from './users.module.scss';

export default function Users() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div>
      <div className={styles.header}>
        <h2>用户管理</h2>
        <Button onClick={() => setShowAdd(true)}>新增用户</Button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>张三</td>
            <td>zhang@example.com</td>
            <td>
              <Button variant="secondary" onClick={() => setShowEdit(true)}>修改</Button>
              <Button variant="danger" onClick={() => setShowDelete(true)}>删除</Button>
            </td>
          </tr>
        </tbody>
      </table>

      <Modal show={showAdd} title="新增用户" onClose={() => setShowAdd(false)}>
        <form className={styles.form}>
          <input placeholder="用户名" />
          <input placeholder="邮箱" />
          <div className={styles.actions}>
            <Button onClick={() => setShowAdd(false)}>保存</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showEdit} title="修改用户" onClose={() => setShowEdit(false)}>
        <form className={styles.form}>
          <input defaultValue="张三" />
          <input defaultValue="zhang@example.com" />
          <div className={styles.actions}>
            <Button onClick={() => setShowEdit(false)}>更新</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showDelete} title="删除用户" onClose={() => setShowDelete(false)}>
        <p>确定删除该用户吗？</p>
        <div className={styles.actions}>
          <Button variant="danger" onClick={() => setShowDelete(false)}>删除</Button>
        </div>
      </Modal>
    </div>
  );
}
