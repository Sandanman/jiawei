# 页面布局设计文档

## 页面概览

- 页面名称：管理后台详情页模板
- 路由：/{资源}/{id}（/families/:id /dishes/:id /users/:id /orders/:id /reward-orders/:id）
- 版本：1.0
- 场景：from_requirement
- 任务 ID：20261124-001
- 生成时间：2026-11-24
- 目标：统一详情页结构与交互：信息卡片 + 子表格 + 操作区，高危操作经二次确认弹窗
- 使用角色：平台超级管理员
- 入口：列表页行点击进入
- 权限：需登录
- 数据来源：GET /api/admin/{detailEndpoint}
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
- `lyt.detail.root` 根节点（page/vertical）
  - `lyt.detail.header` 标题与操作区（container/horizontal，auto）
  - `lyt.detail.info-card` 基础信息卡（container/vertical，auto）
  - `lyt.detail.sub-table` 关联数据区（container/vertical，flex:1）
```

## 区域与组件明细

| 组件 ID | 所在区域 | 类型 | 来源 | 组件库 |
| --- | --- | --- | --- | --- |
| `cmp.detail.title` | `lyt.detail.header` | 页面标题 Typography.Title | ui_library | antd Typography.Title |
| `cmp.detail.status-tag` | `lyt.detail.header` | 状态标签 Tag | ui_library | antd Tag |
| `cmp.detail.back-button` | `lyt.detail.header` | 返回按钮 | ui_library | antd Button |
| `cmp.detail.edit-button` | `lyt.detail.header` | 编辑按钮 | ui_library | antd Button |
| `cmp.detail.danger-button` | `lyt.detail.header` | 高危操作按钮 | ui_library | antd Button(danger) |
| `cmp.detail.info-descriptions` | `lyt.detail.info-card` | 描述列表 Descriptions | ui_library | antd Descriptions |
| `cmp.detail.sub-table` | `lyt.detail.sub-table` | 关联数据表格 Table | ui_library | antd Table |

## 交互与流程

| 交互 ID | 来源 | 方法 / 说明 |
| --- | --- | --- |
| `it.detail.back` | `cmp.detail.back-button` | 纯前端路由跳转 |
| `it.detail.edit` | `cmp.detail.edit-button` | 打开本地编辑态，提交由页面自定义 |
| `it.detail.open-confirm` | `cmp.detail.danger-button` | 仅打开弹窗；影响范围由弹窗内可选生命周期方法加载 |
| `it.detail.confirm-cancel` | `btn.detail.danger-cancel` | 仅关闭弹窗 |
| `it.detail.confirm-submit` | `btn.detail.danger-submit` | `mth.detail.submit` |

## 方法与数据（API / Mock）

| 方法 ID | 名称 | 触发 | 数据模式 | 接口 |
| --- | --- | --- | --- | --- |
| `mth.detail.load` | loadDetail | lifecycle(useEffect(mount,id)) | api | GET /api/admin/{detailEndpoint}/{id} |
| `mth.detail.load-related` | loadRelated | lifecycle(useEffect(mount,id)) | api | GET /api/admin/{detailEndpoint}/{id}/{related} |
| `mth.detail.load-impact` | loadImpact | interaction | api | GET /api/admin/{impactEndpoint}/{id}/close-impact |
| `mth.detail.submit` | handleDangerSubmit | interaction | api | POST /api/admin/{actionEndpoint} |

## 弹窗、抽屉与确认框

- `ovl.detail.danger-confirm` 高危操作二次确认弹窗（modal），触发交互 `it.detail.open-confirm`
  - 按钮 `btn.detail.danger-cancel` 取消 → `it.detail.confirm-cancel`
  - 按钮 `btn.detail.danger-submit` 确认 → `it.detail.confirm-submit`

## 页面状态

| 状态 ID | 目标 | 类型 | 适用 | 说明 |
| --- | --- | --- | --- | --- |
| `st.detail.info-loading` | `cmp.detail.info-descriptions` | loading | applicable | 骨架屏 |
| `st.detail.info-empty` | `cmp.detail.info-descriptions` | empty | not_applicable | 记录不存在时直接展示 404 异常页 |
| `st.detail.info-error` | `cmp.detail.info-descriptions` | error | applicable | 错误文案 + 重试 |
| `st.detail.sub-loading` | `cmp.detail.sub-table` | loading | applicable | 表格 loading |
| `st.detail.sub-empty` | `cmp.detail.sub-table` | empty | applicable | Empty 组件“暂无关联数据” |
| `st.detail.sub-error` | `cmp.detail.sub-table` | error | applicable | 错误文案 + 重试 |

## 响应式行为

- 断点：desktop(1200-+)、tablet(768-1199)、mobile(0-767)
- `lyt.detail.header`：小于 768px 标题与操作按钮换行堆叠
- `lyt.detail.info-card`：Descriptions 列数由 3 列降为 1 列
- `lyt.detail.sub-table`：窄屏表格横向滚动

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

- [已确认] asm.detail.001：DangerConfirm 为全局通用组件，通过 props 注入影响范围内容与提交函数
- 规则 br.detail.001：高危操作必须填写原因 4-200 字，二次确认后方可提交
- 规则 br.detail.002：删除类操作若被引用，需展示引用计数并阻止

## 校验结果

- 结构校验：`validate-layout.mjs --mode final` 通过。
- 全部对象 ID 已在本文件列出。
