'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import SuperSearch, { SuperSearchSection } from '@/components/SuperSearch';
import { menuItems, footerItems } from '@/components/menuItems';
import { Users, ClipboardList, Package, FolderKanban } from 'lucide-react';

function buildSections(): SuperSearchSection[] {
  const users: SuperSearchSection = {
    key: 'users',
    label: '用户',
    icon: <Users className="h-4 w-4" />,
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
    items: [
      {
        id: 'o_2024_001',
        title: '2024-001',
        subtitle: '张三 · ￥1299 · 已支付',
        status: '已支付',
        meta: {
          订单ID: 'o_2024_001',
          用户: '张三',
          金额: '￥1299',
          创建时间: '2024-11-02 14:22',
          最近更新: '2024-11-03 09:01',
          渠道: 'App',
        },
      },
      {
        id: 'o_2024_002',
        title: '2024-002',
        subtitle: '李四 · ￥599 · 待支付',
        status: '待支付',
        meta: {
          订单ID: 'o_2024_002',
          用户: '李四',
          金额: '￥599',
          创建时间: '2024-11-05 09:10',
          最近更新: '2024-11-05 09:12',
          渠道: 'Web',
        },
      },
    ],
    seeAllHref: '#',
  };

  const products: SuperSearchSection = {
    key: 'products',
    label: '产品',
    icon: <Package className="h-4 w-4" />,
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
    ],
    seeAllHref: '#',
  };

  const projects: SuperSearchSection = {
    key: 'projects',
    label: '项目',
    icon: <FolderKanban className="h-4 w-4" />,
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

  return [users, orders, products, projects];
}

export default function SuperSearchDemoPage() {
  const sections = buildSections();
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">超级搜索框 · SuperSearch</div>}
    >
      <Card>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            该组件遵循本项目的 Tailwind 设计令牌与样式，演示跨实体（不限于用户/订单）的统一搜索体验。下方为示例：
          </p>
          <div className="w-full max-w-3xl">
            <SuperSearch
              sections={sections}
              density="standard"
              preview="right"
              highlight="tint"
              actions="hoverOnly"
              className="w-full"
              placeholder="搜索用户、订单、产品、项目…"
              history={['报表', '新增客户', '近7天订单', '退款', '库存']}
              hints={[
                '示例：用户 张三',
                '示例：订单 2024-001',
                '示例：产品 iPhone',
                '示例：项目 飞鹰计划',
              ]}
              // Configurable interactions
              enablePreview
              previewDelay={120}
              previewHideDelay={120}
              // Selection configs: users/products multiple; orders/projects single
              selectable
              selectionMode="multiple"
              sectionSelectionMode={{ orders: 'single', projects: 'single' }}
              showSelectedBelow
            />
          </div>
          <div className="text-xs text-gray-400">
            提示：输入关键字如 “张三”、“2024-001”、“iPhone”、“飞鹰” 观察分栏结果与预览卡；点击“转为筛选”查看 Chips 条的示意。
          </div>
        </div>
      </Card>
    </Layout>
  );
}
