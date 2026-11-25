# admin · 管理后台前端

React 19 + TypeScript + antd 6 + CSS Modules + Vite 8 的管理后台，调用 `server` 的 `/api/admin/*` 接口。

## 常用命令

```bash
npm install          # 首次安装依赖
npm run dev          # 开发（默认 5174，/api/admin 代理到 http://localhost:3000）
npm run typecheck    # tsc --noEmit
npm run build        # 类型检查 + 生产构建
npm run preview      # 预览构建产物
```

开发环境可用 `VITE_API_PROXY_TARGET` 覆盖代理目标，`VITE_API_BASE` 覆盖接口基础路径。

## 结构约定

```
src/
├── api/            接口封装（http.ts 统一拦截 + 各模块）
├── components/     公共组件：PageContainer / SearchForm / DataTable / StatusTag / DangerConfirm / JsonDiff
├── hooks/          use-table-query：筛选 + 分页
├── layouts/        basic-layout（侧栏+顶栏）、auth-layout（登录页）
├── pages/          按业务模块分目录，列表与详情分文件
├── router/         路由表 + 菜单元数据（同源）
├── stores/         token 与登录态（Context）
├── styles/         全局样式
├── theme/          设计令牌（tokens.ts 单一来源 → antd 主题 + CSS 变量）
└── utils/          格式化、常量字典、消息桥、日期
```

## 约定

- 高危操作统一通过 `DangerConfirm`：展示影响范围 + 必填操作原因（4–200 字）。
- 业务错误由 `api/http.ts` 拦截器统一 `message.error`，页面只在需要时补充说明。
- `code === 401` 或 HTTP 401 时清除 token 并跳转 `/login`。
- 颜色、圆角、间距只能取 `theme/tokens.ts` 或 CSS 变量 `--admin-*`，不写死色值。
- 代码风格：4 空格、单引号、无分号、camelCase、kebab-case 文件名。
