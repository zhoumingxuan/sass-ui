# SassUI

## 项目概览
- 基于 Next.js App Router 与 Tailwind CSS v4 的管理系统 UI 组件库，默认涵盖布局、表单、数据展示与反馈等高频业务控件。
- 通过语义化设计 Token、Portal 锚点与可组合的状态 API，支持管理系统常见的中后台场景快速搭建与扩展。
- 代码位于 `src` 目录，文档与设计细节位于 `docs/`，Tailwind 设计 Token 在 `tailwind.config.ts` 中集中管理。

## 统一设计概念：语义驱动的稳态运营空间
SassUI 的组件与样式以“语义驱动的稳态运营空间”为设计核心：我们将后台工作的连续性、操作的低噪声以及信息的高密度阅读视作同等重要的目标。所有控件围绕统一的节奏体系、语义色板与交互回路生成，确保用户在长时间操作中仍能保持方向感、信任感与效率。

这一概念自上而下分为三层：
1. **空间节奏层**——以 8pt Grid、固定的关键尺寸（`spacing.header=40px`、`spacing.sidebar=224px`、`spacing.modal=400px` 等）和 `shadow-elevation-1/2/3` 构造稳定的视觉节奏，保证从布局骨架到浮层都能遵循同一尺度语言。
2. **语义分层层**——使用统一的 Token（`primary/#1e80ff`、`success/#52c41a`、`warning/#faad14`、`error/#ff4d4f`、`info/#13c2c2`、`bg/#f7f8fa`、`nav` 系列等）定义导航、内容与反馈的层级关系，让状态、操作与背景的对比度始终可预测。
3. **操作回路层**——依托 `controlRing`、`controlDisabled`、统一的 hover/active/transition 规则以及 Portal 锚点 `#layout-body`，让焦点、禁用、反馈和跨层浮层都遵循一致的交互语法，保证键盘操作、读屏辅助与复杂筛选流程的连续体验。

### 设计支柱
- **节奏化空间**：所有间距、圆角、版块尺寸均回落到 8 的倍数；不同布局区域（头部、主区、侧栏、弹层）通过固定 Token 协调，自带呼吸感与可预估的留白节奏。
- **语义化色板**：导航、背景、内容、辅助提示与状态使用分层色板，激活态通过主色渐变或 15% 叠加表达；中性色确保数据密集界面在灰阶中仍具层次。
- **可读的密度管理**：表单双栏/三栏、表格 `compact/cozy/comfortable` 行高、卡片内层间距等规则被抽象为属性，帮助业务在高密度信息与舒适可读间快速切换。
- **连续的交互回路**：所有控件的 hover（轻微升起或浅色填充）、active（回落或压暗）与 focus-visible（主色描边）保持一致，输入类控件支持草稿、清除、状态提醒，反馈控件从 Alert 到 Modal 形成层级闭环。
- **可扩展的语义节点**：菜单、面包屑、表单字段、数据表格均通过集中配置或上下文注入语义名称，Portal 锚点保证弹出层与滚动容器的隔离与稳定。

### 设计落地准则
- **布局骨架**：采用固定侧栏 + 弹性内容的双列框架；Header 与 Content 共享间距策略，滚动容器默认自适应高度，并通过 `nice-scrollbar` 保持自定义滚动体验。
- **控件族群**：Button、ActionLink、Tabs、Switch、Slider、输入与选择类控件全部共享同一 `controlBase` 基因，实现外观差异化的同时保持交互一致；复杂控件（DateRangePicker、SuperSearch、GridTable 等）在此基因上扩展语义模块与快捷操作。
- **反馈体系**：Alert、Message、Modal、Drawer、Loading、进度与徽章以 Token 化状态色和统一的阴影/模糊层组合，形成由页内提示到全局遮罩的完整层级。
- **数据结构视图**：卡片、栅格、Steps、Tree、GridTable 提供从总览到层级的数据阅读模式，在节奏化布局中通过阴影、缩进与虚拟滚动维持性能与可视化提示。

## 快速开始
- 安装依赖：`pnpm install` 或 `npm install`
- 启动开发环境：`pnpm dev`
- 构建产物：`pnpm build`
- Tailwind Token 与组件示例可在 `docs/components-design.md` 与 Storybook（开发中）中查看。

## 目录结构速览
```
.
├── docs/                    # 设计说明与使用文档
├── public/                  # 静态资源
├── src/                     # 组件与页面源代码
├── tailwind.config.ts       # 设计 Token 与语义色板
└── tools/                   # 开发与构建辅助脚本
```

## 设计协作建议
- 新增组件时先复用或扩展现有 Token（spacing、color、shadow、radius），保持节奏与语义一致。
- 若需新状态色或层级，请在 `tailwind.config.ts` 中补充 Token，并在文档中同步说明设计意图。
- 控件默认支持键盘操作与可访问性特性，扩展时请沿用 `controlRing`、`focus-visible` 与 ARIA 语义。

## License
MIT
