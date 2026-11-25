# 页面布局设计文档

## 页面概览

- 页面名称：管理后台列表页模板
- 路由：/{资源}（/families /dishes /users /orders /reward-orders /audit-logs）
- 版本：1.0
- 场景：from_requirement
- 任务 ID：20261124-001
- 生成时间：2026-11-24
- 目标：统一列表页结构与交互：页面标题区 + 筛选栏 + 数据表格 + 分页
- 使用角色：平台超级管理员
- 入口：侧栏菜单进入
- 权限：需登录
- 数据来源：GET /api/admin/{listEndpoint}
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
- `lyt.list.root` 根节点（page/vertical）
  - `lyt.list.header` 页面标题区（container/horizontal，auto）
  - `lyt.list.search` 筛选栏卡片（container/vertical，auto）
  - `lyt.list.table` 表格卡片（container/vertical，flex:1）
    - `lyt.list.table.toolbar` 表格工具条（container/horizontal，auto）
    - `lyt.list.table.body` 表格主体（container/vertical，flex:1）
    - `lyt.list.table.footer` 分页区（container/horizontal，auto）
```

## 区域与组件明细

| 组件 ID | 所在区域 | 类型 | 来源 | 组件库 |
| --- | --- | --- | --- | --- |
| `cmp.list.title` | `lyt.list.header` | 页面标题 Typography.Title | ui_library | antd Typography.Title |
| `cmp.list.primary-action` | `lyt.list.header` | 主操作按钮组 | ui_library | antd Button |
| `cmp.list.search-form` | `lyt.list.search` | 筛选表单 Form（字段由具体页面注入） | ui_library | antd Form |
| `cmp.list.search-query` | `lyt.list.search` | 查询按钮 | ui_library | antd Button(type=primary) |
| `cmp.list.search-reset` | `lyt.list.search` | 重置按钮 | ui_library | antd Button |
| `cmp.list.toolbar-refresh` | `lyt.list.table.toolbar` | 刷新按钮 | ui_library | antd Button(icon=Reload) |
| `cmp.list.data-table` | `lyt.list.table.body` | 数据表格 Table | ui_library | antd Table |
| `cmp.list.pagination` | `lyt.list.table.footer` | 分页 Pagination | ui_library | antd Pagination |

## 交互与流程

| 交互 ID | 来源 | 方法 / 说明 |
| --- | --- | --- |
| `it.list.query` | `cmp.list.search-query` | `mth.list.query` |
| `it.list.reset` | `cmp.list.search-reset` | `mth.list.reset` |
| `it.list.page-change` | `cmp.list.pagination` | `mth.list.page-change` |
| `it.list.refresh` | `cmp.list.toolbar-refresh` | `mth.list.refresh` |
| `it.list.row-detail` | `cmp.list.data-table` | 纯前端路由跳转 |
| `it.list.primary-click` | `cmp.list.primary-action` | 各列表主操作不同（多数列表无新建），由具体页面覆盖 |

## 方法与数据（API / Mock）

| 方法 ID | 名称 | 触发 | 数据模式 | 接口 |
| --- | --- | --- | --- | --- |
| `mth.list.load` | loadList | lifecycle(useEffect(mount)) | api | GET /api/admin/{listEndpoint}?page&pageSize&keyword&status |
| `mth.list.query` | handleQuery | interaction | api | GET /api/admin/{listEndpoint}?page&pageSize&...filters |
| `mth.list.reset` | handleReset | interaction | api | GET /api/admin/{listEndpoint}?page=1&pageSize |
| `mth.list.page-change` | handlePageChange | interaction | api | GET /api/admin/{listEndpoint}?page&pageSize |
| `mth.list.refresh` | handleRefresh | interaction | api | GET /api/admin/{listEndpoint}?page&pageSize&...filters |

## 弹窗、抽屉与确认框

本版式无弹窗。

## 页面状态

| 状态 ID | 目标 | 类型 | 适用 | 说明 |
| --- | --- | --- | --- | --- |
| `st.list.table-loading` | `cmp.list.data-table` | loading | applicable | 表格骨架/旋转器，筛选按钮禁用 |
| `st.list.table-empty` | `cmp.list.data-table` | empty | applicable | Empty 组件，文案“暂无数据”，提供重置筛选操作 |
| `st.list.table-error` | `cmp.list.data-table` | error | applicable | 错误文案 + 重试按钮 |

## 响应式行为

- 断点：desktop(1200-+)、tablet(768-1199)、mobile(0-767)
- `lyt.list.header`：小于 768px 标题与主操作换行堆叠
- `lyt.list.search`：小于 768px 表单项单列
- `lyt.list.table.body`：窄屏表格横向滚动

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

- [已确认] asm.list.001：列表页共用 useTableQuery hook 管理分页与筛选状态
- 规则 br.list.001：分页 page 默认 1，pageSize 默认 20，上限 100
- 规则 br.list.002：手机号在列表中脱敏为 138****0000，详情页展示完整

## 校验结果

- 结构校验：`validate-layout.mjs --mode final` 通过。
- 全部对象 ID 已在本文件列出。
