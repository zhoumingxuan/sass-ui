'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tree, { TreeNode, Key } from '@/components/Tree';
import { menuItems, footerItems } from '@/components/menuItems';
import { useMemo, useState } from 'react';

export default function TreeDemo() {
  const baseData: TreeNode[] = useMemo(() => ([
    { key: 'c', title: '客户', children: [
      { key: 'c-a', title: '华东区', children: [
        { key: 'c-a-1', title: '张三' },
        { key: 'c-a-2', title: '李四', selectable: false },
      ]},
      { key: 'c-b', title: '华南区', children: [
        { key: 'c-b-1', title: '王五', disabled: true },
        { key: 'c-b-2', title: '赵六' },
      ]},
    ]},
    { key: 'o', title: '订单', children: [
      { key: 'o-2025', title: '2025 年', isLeaf: false },
      { key: 'o-2024', title: '2024 年', isLeaf: false },
    ]},
  ]), []);

  // async loader (mock)
  const loadData = async (node: TreeNode): Promise<TreeNode[]> => {
    await new Promise(r => setTimeout(r, 600));
    if (node.key === 'o-2025') {
      return [
        { key: 'o-2025-01', title: '一月' },
        { key: 'o-2025-02', title: '二月' },
      ];
    }
    if (node.key === 'o-2024') {
      return [
        { key: 'o-2024-06', title: '六月' },
        { key: 'o-2024-07', title: '七月' },
      ];
    }
    return [];
  };

  const [expanded, setExpanded] = useState<Key[]>(['c']);
  const [selected, setSelected] = useState<Key[]>([]);
  const [checked, setChecked] = useState<Key[]>([]);
  const [keyword, setKeyword] = useState('');
  const [ctx, setCtx] = useState<{x:number;y:number;node?:TreeNode}|null>(null);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">树控件 · 业务导航</div>}
    >
      <div className="space-y-6">
        <Card title="基础树（可选择 + 搜索）">
          <div className="mb-3 grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
              <input
                placeholder="搜索节点（按名称）"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <Tree
                data={baseData}
                selectable="single"
                expandedKeys={expanded}
                onExpand={setExpanded}
                selectedKeys={selected}
                onSelect={(keys) => setSelected(keys)}
                keyword={keyword}
                onContextMenu={(node, e) => setCtx({ x: e.clientX + window.scrollX, y: e.clientY + window.scrollY, node })}
                className="p-2 bg-white rounded-xl border border-gray-200"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="space-y-2 text-sm text-gray-700">
                <div>已展开：{expanded.join(', ') || '无'}</div>
                <div>已选择：{selected.join(', ') || '无'}</div>
              </div>
            </div>
          </div>
          {ctx && ctx.node && (
            <div
              className="fixed z-[1300] min-w-36 rounded-md border border-gray-200 bg-white py-1 shadow-elevation-1"
              style={{ top: ctx.y, left: ctx.x }}
              onMouseLeave={() => setCtx(null)}
            >
              <button className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => { alert('重命名: ' + ctx.node!.key); setCtx(null); }}>重命名</button>
              <button className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => { alert('新建子节点: ' + ctx.node!.key); setCtx(null); }}>新建子节点</button>
              <button className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-gray-50" onClick={() => { alert('删除: ' + ctx.node!.key); setCtx(null); }}>删除</button>
            </div>
          )}
        </Card>

        <Card title="可勾选（父子联动 + 禁用示例）">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <Tree
                data={baseData}
                checkable
                checkInteractive
                selectable={false}
                defaultExpandedKeys={['c']}
                checkedKeys={checked}
                onCheck={(keys) => setChecked(keys)}
                className="p-2 bg-white rounded-xl border border-gray-200"
              />
              <div className="mt-3 flex gap-2">
                <Button variant="default" onClick={() => setChecked([])}>清空选择</Button>
                <Button onClick={() => setChecked(['c-a-1','c-a-2'])}>选择华东区下客户（演示半选）</Button>
                <Button onClick={() => setChecked(['c-b-2'])}>选择华南区可选客户（禁用不受影响）</Button>
              </div>
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="space-y-2 text-sm text-gray-700">
                <div>已勾选：{checked.join(', ') || '无'}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="只读勾选（展示勾选状态，但禁止手动更改）">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <Tree
                data={baseData}
                checkable
                checkInteractive={false}
                selectable={false}
                defaultExpandedKeys={['c']}
                checkedKeys={checked}
                onCheck={(keys) => setChecked(keys)}
                className="p-2 bg-white rounded-xl border border-gray-200"
              />
              <div className="mt-3 text-xs text-gray-500">该示例用于“系统根据规则勾选，但用户无法手动修改”的场景。</div>
            </div>
          </div>
        </Card>

        <Card title="异步加载（示例：订单年份 -> 月份）">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <Tree
                data={baseData}
                selectable="single"
                defaultExpandedKeys={['o']}
                onSelect={(keys) => setSelected(keys)}
                loadData={loadData}
                loading={false}
                className="p-2 bg-white rounded-xl border border-gray-200"
              />
            </div>
            <div className="col-span-12 md:col-span-6 text-sm text-gray-700">支持按需加载，避免一次性渲染；实际项目可对接接口。</div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
