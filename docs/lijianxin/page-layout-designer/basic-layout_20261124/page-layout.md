# 页面布局设计文档

## 页面概览

- 页面名称：管理后台基础布局
- 路由：/（全局框架，包裹所有后台页面）
- 版本：1.0
- 场景：from_requirement
- 任务 ID：20261124-001
- 生成时间：2026-11-24
- 目标：为后台所有业务页提供统一外壳：左侧导航、顶部面包屑与管理员菜单、内容区容器
- 使用角色：平台超级管理员
- 入口：登录成功后进入 /families
- 权限：需登录，未登录或 401 跳转 /login
- 数据来源：GET /api/admin/auth/me
- 适配设备：desktop、tablet

## 项目技术栈与规范

| 项 | 内容 |
| --- | --- |
| 框架 | React 19.3.1（TypeScript 7.0.2，Vite 8.3.8） |
| UI 库 | antd 6.7.2，图标 @ant-design/icons，路由 react-router-dom 7.x |
| 样式体系 | CSS Modules (*.module.scss) + SCSS |
| Token 来源 | theme/antd-theme.ts（ConfigProvider token）+ styles/tokens.scss（--admin-* CSS 变量，同源生成） |
| 缩进 | 4 空格 |
| 引号 | 单引号 |
| 分号 | 不写 |
| 命名 | camelCase / kebab-case / kebab-case |

## 页面布局树

```text
- `lyt.basic.root` 根节点（page/vertical）
  - `lyt.basic.main` 主体两栏（container/horizontal，flex:1）
    - `lyt.basic.sider` 左侧导航栏（aside/vertical，240px 固定，可折叠 64px）
    - `lyt.basic.body` 右侧主体（container/vertical，flex:1）
      - `lyt.basic.header` 顶部栏（header/horizontal，56px 固定）
      - `lyt.basic.content` 内容区（main/vertical，flex:1，overflow:auto，padding 24px）
```

## 区域与组件明细

| 组件 ID | 所在区域 | 类型 | 来源 | 组件库 |
| --- | --- | --- | --- | --- |
| `cmp.basic.brand` | `lyt.basic.sider` | 品牌标题 | page_local | 仅基础布局使用，文本“家味小札 · 管理后台” |
| `cmp.basic.menu` | `lyt.basic.sider` | 导航菜单 Menu | ui_library | antd Menu |
| `cmp.basic.collapse` | `lyt.basic.sider` | 折叠按钮 | ui_library | antd Button(icon) |
| `cmp.basic.breadcrumb` | `lyt.basic.header` | 面包屑 Breadcrumb | ui_library | antd Breadcrumb |
| `cmp.basic.admin-dropdown` | `lyt.basic.header` | 管理员菜单 Dropdown | ui_library | antd Dropdown |
| `cmp.basic.outlet` | `lyt.basic.content` | 子路由出口 Outlet | ui_library | react-router-dom Outlet |

## 交互与流程

| 交互 ID | 来源 | 方法 / 说明 |
| --- | --- | --- |
| `it.basic.menu-click` | `cmp.basic.menu` | 纯前端路由跳转，不调用接口 |
| `it.basic.goto-change-password` | `cmp.basic.admin-dropdown` | 纯前端路由跳转 |
| `it.basic.logout` | `cmp.basic.admin-dropdown` | `mth.basic.logout` |

## 方法与数据（API / Mock）

| 方法 ID | 名称 | 触发 | 数据模式 | 接口 |
| --- | --- | --- | --- | --- |
| `mth.basic.load-admin` | loadCurrentAdmin | lifecycle(useEffect(mount)) | api | GET /api/admin/auth/me |
| `mth.basic.logout` | logout | interaction | api | POST /api/admin/auth/logout |

## 弹窗、抽屉与确认框

本版式无弹窗。

## 页面状态

| 状态 ID | 目标 | 类型 | 适用 | 说明 |
| --- | --- | --- | --- | --- |
| `st.basic.admin-loading` | `cmp.basic.admin-dropdown` | loading | applicable | 显示占位“管理员” |
| `st.basic.admin-empty` | `cmp.basic.admin-dropdown` | empty | not_applicable | 未登录时不会渲染基础布局 |
| `st.basic.admin-error` | `cmp.basic.admin-dropdown` | error | applicable | 显示“未知管理员”，不阻塞页面 |

## 响应式行为

- 断点：desktop(1200-+)、tablet(768-1199)、mobile(0-767)
- `lyt.basic.sider`：小于 992px 折叠为 64px 图标栏
- `lyt.basic.content`：小于 768px 时 padding 由 24px 变为 16px

## 视觉规范

| 类别 | 取值 |
| --- | --- |
| 主题色 | 主色 #ff6b35，hover #ff8555，active #e85a2a，浅底 #fff3ee |
| 语义色 | success #4cd964，warning #f0ad4e，danger #dd524d，info #1890ff |
| 中性色 | 页面底 #f8f8f8，卡片 #ffffff，表头 #fafafa，边框 #e5e5e5，正文 #333333，辅助 #999999 |
| 字号 | 页面标题 20px/28px 600，卡片标题 16px/24px 600，正文 14px/22px 400，辅助 12px/20px 400 |
| 间距 | xs:4px，sm:8px，md:12px，lg:16px，xl:24px，pagePadding:24px，cardGap:16px，formItemGap:16px |
| 圆角 | sm 4px，md 8px，lg 12px |
| 阴影 | 卡片 0 1px 2px rgba(0,0,0,0.04)，浮层 0 6px 16px rgba(0,0,0,0.08) |
| 密度 | default |

## 页面代码生成约束

- 组件统一从 `@/components` 引入，页面只组合公共组件，不重复实现表格/筛选/确认弹窗。
- 样式使用 CSS Modules（`*.module.scss`），颜色/间距引用 `--admin-*` CSS 变量，不硬编码十六进制。
- 所有接口经 `api/http.ts` 统一请求器，错误由拦截器统一提示。
- 高危操作只能经 `DangerConfirm` 组件，原因必填 4-200 字。
- 代码风格：4 空格、单引号、不写分号、camelCase、文件名 kebab-case、JSDoc 注释。

## 待确认项与建议

- [已确认] asm.basic.001：侧栏菜单项与路由表同源维护（router/routes.ts）
- 规则 br.basic.001：管理员 token 有效期 8 小时，过期或接口返回 401 时清空 token 并跳转 /login

## 校验结果

- 结构校验：`validate-layout.mjs --mode final` 通过。
- 全部对象 ID 已在本文件列出。
