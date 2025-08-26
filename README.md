这是一个使用 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 构建并通过 [Tailwind CSS](https://tailwindcss.com) 样式化的 [Next.js](https://nextjs.org) 项目。

## UI 组件设计理念

Sass UI 采用自创的 **“浮岛设计系统”**。组件被视为漂浮在中性背景上的轻盈“岛屿”，通过阴影与圆角塑造层次感，并在统一的 8px 基准栅格上排布。

### 浮岛层次
- 所有可交互元素均以白色或浅色“浮岛”呈现，搭配柔和阴影与 `rounded-lg` 圆角，形成清晰的层次。
- `hover` 与 `focus` 触发更深的阴影或描边，营造悬浮反馈。

### 8px 栅格
- 以 8px 为最小单位构建自由栅格。`Grid` 组件、间距、圆角与阴影均遵循 8 的倍数，保证布局节奏统一。

### 主题 Token
- **语义色**：`primary`、`default`、`warning`、`success`、`error`、`info`。
- **字体**：Noto Sans，基准字号 14px。
- **层次样式**：`border border-gray-200`、`shadow-sm` 为基础层，交互时升级为 `shadow-md`。

### 组件规范
- 边框颜色统一为 `gray-200`，并保持 `rounded-lg` 圆角。
- 内外间距以 8px（Tailwind 单位 `2`）为最小步长，保持布局一致。
- 状态色与阴影深浅按照语义色加深，强调层次与反馈。

这种“浮岛”理念强调了信息密度与呼吸感的平衡，为管理后台类界面提供了清晰易读、可扩展的视觉体系。

## 快速开始

首先启动开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

你可以通过编辑 `app/page.tsx` 来修改页面，保存后会自动更新。

本项目使用 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 自动优化并加载 [Geist](https://vercel.com/font) 字体。

## 学习更多

想了解更多关于 Next.js 的信息，请查阅以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 的功能与 API。
- [Learn Next.js](https://nextjs.org/learn) - 交互式教程。

你也可以查看 [Next.js GitHub 仓库](https://github.com/vercel/next.js) 并分享你的反馈与贡献！

## 部署到 Vercel

部署 Next.js 应用最简单的方式是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)。

更多部署细节请参考 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)。

