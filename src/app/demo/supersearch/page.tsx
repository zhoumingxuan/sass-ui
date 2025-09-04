'use client';

import Layout from '@/components/Layout';
import { useState } from 'react';
import Card from '@/components/Card';
import SuperSearch, { SuperSearchSection } from '@/components/SuperSearch';
import { menuItems, footerItems } from '@/components/menuItems';
import { Users, ClipboardList, Package, FolderKanban } from 'lucide-react';

function buildSections(): SuperSearchSection[] {
  const users: SuperSearchSection = {
    key: 'users',
    label: '用户',
    icon: <Users className="h-4 w-4" />,
    search_keys: ['title', 'subtitle', 'status', 'meta.邮箱', 'meta.组织', 'meta.角色'],
    minWidth: 320,
    items: [
      {
        id: 'u_1001',
        title: '张三',
        subtitle: 'zhangsan@example.com',
        status: 'Active',
        meta: {
          用户ID: 'u_1001',
          邮箱: 'zhangsan@example.com',
          角色: '管理员',
          组织: '华北一区',
          最近登录: '2025-08-10 10:12',
        },
      },
      {
        id: 'u_1002',
        title: '李四',
        subtitle: 'lisi@corp.cn',
        status: 'Disabled',
        meta: {
          用户ID: 'u_1002',
          邮箱: 'lisi@corp.cn',
          角色: '审核员',
          组织: '华东二区',
          最近登录: '2025-08-01 08:45',
        },
      },
    ],
    seeAllHref: '#',
  };

  const orders: SuperSearchSection = {
    key: 'orders',
    label: '订单',
    icon: <ClipboardList className="h-4 w-4" />,
    search_keys: ['title', 'subtitle', 'status', 'meta.订单ID', 'meta.用户', 'meta.渠道'],
    minWidth: 360,
    items: [
      {
        id: 'o_2024_001',
        title: '2024-001',
        subtitle: '张三 · ￥299 · 已支付',
        status: '已支付',
        meta: {
          订单ID: 'o_2024_001',
          用户: '张三',
          金额: '￥299',
          创建时间: '2024-11-02 14:22',
          最近更新: '2024-11-03 09:01',
          渠道: 'App',
        },
      },
      {
        id: 'o_2024_002',
        title: '2024-002',
        subtitle: '李四 · ￥99 · 待支付',
        status: '待支付',
        meta: {
          订单ID: 'o_2024_002',
          用户: '李四',
          金额: '￥99',
          创建时间: '2024-11-05 09:10',
          最近更新: '2024-11-05 09:12',
          渠道: 'Web',
        },
      },
    ],
    seeAllHref: '#',
  };

  // 追加 150 条产品用于大数量场景演示
  const extraProducts = Array.from({ length: 150 }, (_, i) => ({
    id: `p_demo_${i + 1}`,
    title: `测试产品 ${i + 1}`,
    subtitle: i % 2 === 0 ? '演示数据 · 批量' : '演示数据',
    meta: { 产品ID: `p_demo_${i + 1}`, 分类: '演示', 库存: '充足' },
  }));

  const products: SuperSearchSection = {
    key: 'products',
    label: '产品',
    icon: <Package className="h-4 w-4" />,
    search_keys: ['title', 'subtitle', 'meta.产品ID', 'meta.分类'],
    minWidth: 320,
    items: [
      {
        id: 'p_iphone',
        title: 'iPhone 15 Pro',
        subtitle: '智能手机 · 黑钛金属',
        meta: {
          产品ID: 'p_iphone',
          分类: '手机',
          库存: '充足',
          上架时间: '2024-09-20',
        },
      },
      {
        id: 'p_mac',
        title: 'MacBook Air 13',
        subtitle: '轻薄本 · M3',
        meta: {
          产品ID: 'p_mac',
          分类: '电脑',
          库存: '紧张',
          上架时间: '2024-03-15',
        },
      },
      ...extraProducts,
    ],
    seeAllHref: '#',
  };

  const projects: SuperSearchSection = {
    key: 'projects',
    label: '项目',
    icon: <FolderKanban className="h-4 w-4" />,
    search_keys: ['title', 'subtitle', 'status', 'meta.项目ID', 'meta.负责人', 'meta.阶段'],
    minWidth: 340,
    items: [
      {
        id: 'prj_1',
        title: '飞鹰计划',
        subtitle: '内部研发 · 进行中',
        status: '进行中',
        meta: {
          项目ID: 'prj_1',
          负责人: '王五',
          阶段: 'Alpha',
          更新时间: '2025-07-22',
        },
      },
      {
        id: 'prj_2',
        title: '北极星',
        subtitle: '客户交付 · 待验收',
        status: '待验收',
        meta: {
          项目ID: 'prj_2',
          负责人: '赵六',
          阶段: 'RC',
          更新时间: '2025-08-18',
        },
      },
    ],
    seeAllHref: '#',
  };

  // 追加 120 条订单用于大数量场景演示
  const extraOrders = Array.from({ length: 120 }, (_, i) => ({
    id: `o_bulk_${(i + 1).toString().padStart(3, '0')}`,
    title: `BULK-${(i + 1).toString().padStart(3, '0')}`,
    subtitle: i % 3 === 0 ? '批量导入 · 待支付' : '批量导入 · 已创建',
    status: i % 3 === 0 ? '待支付' : undefined,
    meta: { 订单ID: `o_bulk_${i + 1}`, 渠道: '批量', 金额: '￥' + String((i % 9) * 11 + 9) },
  }));

  return [users, { ...orders, items: [...orders.items, ...extraOrders] }, products, projects];
}

export default function SuperSearchDemoPage() {
  const sections = buildSections();
  const [lastFilter, setLastFilter] = useState<{ q: string; fields: string[] } | null>(null);
  const [groups, setGroups] = useState<{ query: string; fields: string[] }[] | null>(null);
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">超级搜索 · SuperSearch</div>}
    >
      <Card>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            该组件遵循本项目的 Tailwind 设计令牌与样式，演示跨实体（用户/订单/产品/项目）的统一搜索体验。
          </p>
          <div className="w-full max-w-3xl">
            <SuperSearch
              sections={sections}
              density="standard"
              preview="right"
              highlight="tint"
              capCounts={false}
              className="w-full"
              cache_key="demo:supersearch:history"
              placeholder="搜索用户、订单、产品、项目"
              history={['报表', '新增客户', '近7天订单', '退款', '库存']}
              hints={['示例：用户 张三', '示例：订单 2024-001', '示例：产品 iPhone', '示例：项目 飞鹰计划']}
              enablePreview
              showEmptySections={false}
              selectable
              selectionMode="multiple"
              sectionSelectionMode={{ orders: 'single', projects: 'single' }}
              showSelectedBelow
              renderTruncationHint={({ displayed }) => (
                <span>匹配较多，仅展示前 {displayed} 条</span>
              )}
              filterMode="fields"
              filterFields={[
                { label: '用户ID', param: 'userId' },
                { label: '用户名称', param: 'userName' },
                { label: '用户邮箱', param: 'userEmail' },
                { label: '订单编号', param: 'orderNo' },
              ]}
              allowMultiFilterGroups
              maxFilterGroups={5}
              onFilterSearchGroups={(gs) => {
                setGroups(gs);
                const last = gs[gs.length - 1];
                if (last) setLastFilter({ q: last.query, fields: last.fields });
              }}
            />
          </div>
          <div className="w-full">
            <div className="text-sm text-gray-600 mb-2">普通搜索模式最小宽度测试（容器较窄，匹配多个分类时下拉会按分类最小宽度展开）</div>
            <div className="w-full max-w-[420px] p-3">
              <SuperSearch
                sections={sections}
                density="standard"
                preview="right"
                className="w-full"
                placeholder="试试输入：张三 / 2024-001 / iPhone"
                hints={['示例：用户 张三', '示例：订单 2024-001', '示例：产品 iPhone', '示例：项目 飞鹰计划']}
              />
            </div>
          </div>
          {groups && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>多组条件：</div>
              {groups.map((g, i) => (
                <div key={i}>[{i + 1}] q = "{g.query}", fields = [{g.fields.join(', ')}]</div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400">
            提示：输入“张三”“2024-001”“iPhone”“飞鹰计划”观察匹配与预览；点击“转为筛选”查看 Chips 示例。
          </div>
        </div>
      </Card>
    </Layout>
  );
}
