这是一个使用 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 构建并通过 [Tailwind CSS](https://tailwindcss.com) 样式化的 [Next.js](https://nextjs.org) 项目。

## UI 组件设计理念

Sass UI 采用自创的 **“浮岛设计系统”**。组件被视为漂浮在中性背景上的轻盈“岛屿”，通过阴影与圆角塑造层次感，并在统一的 8px 基准栅格上排布。

### 浮岛层次
- 所有可交互元素均以白色或浅色“浮岛”呈现，搭配柔和阴影与 `rounded-lg` 圆角，形成清晰的层次。
- `hover` 与 `focus` 触发更深的阴影或描边，营造悬浮反馈。

### 8px 栅格
- 以 8px 为最小单位构建自由栅格。`Grid` 组件、间距、圆角与阴影均遵循 8 的倍数，保证布局节奏统一。

### Tailwind 设计 Token（样式常量）
为统一与维护成本，样式常量集中在 `tailwind.config.ts` 的 `theme.extend` 中；组件只使用这些 Token：

- 尺寸/间距（均遵循 8px 栅格）
  - `h-header`: 顶部与侧栏头部高度 40px（5×8）
  - `w-sidebar` / `w-sidebar-collapsed`: 侧栏展开 224px / 折叠 64px
  - `w-modal`: 模态框默认宽度 400px
  - `w-date-input`: 日期输入宽度 176px（22×8）

- 深度（统一的 elevation 阴影）
  - `shadow-elevation-1`: 轻层级（如 Header）
  - `shadow-elevation-2`: 中层级（如侧栏与内容分层）
  - `shadow-elevation-3`: 重层级（如模态框）

组件已同步改造：`Header`、`Menu/侧栏`、`Modal`、`Input(DateRange)`、`message` 等。后续新增请优先复用 Token，避免写死像素（例如 `w-[180px]`）。

### 主题 Token
- **语义色**：`primary`、`default`、`warning`、`success`、`error`、`info`。
- **字体**：Noto Sans，基准字号 14px。
- **层次样式**：`border border-gray-200`、`shadow-sm` 为基础层，交互时升级为 `shadow-md`。

### 组件规范
- 边框颜色统一为 `gray-200`，并保持 `rounded-lg` 圆角。
- 内外间距以 8px（Tailwind 单位 `2`）为最小步长，保持布局一致。
- 状态色与阴影深浅按照语义色加深，强调层次与反馈。

这种“浮岛”理念强调了信息密度与呼吸感的平衡，为管理后台类界面提供了清晰易读、可扩展的视觉体系。
