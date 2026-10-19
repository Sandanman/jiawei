# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目信息

- **项目名称**：jiawei-server（家味小札后端服务）
- **技术栈**：Express 4.19.2 + TypeScript 5.4.0 + MySQL（mysql2）+ JWT
- **包管理器**：npm
- **关键配置**：tsconfig.json（strict: true，路径别名 `@/*` 等）、.env（基于 .env.example）

---

## 常用命令

```bash
npm run dev     # ts-node-dev 开发模式（自动重启）
npm run build   # tsc 编译到 dist/
npm run start   # 运行编译产物
npm run lint    # eslint 检查（.ts）
```

---

## 代码生成优先级（cheers 初始化写入）

**重要**：生成代码时优先使用以下风格：

1. **个人开发风格**（CODE_STYLE_PERSONAL.md）— 最高优先级
2. **项目代码风格**（CODE_STYLE.md）— 次优先级
3. **通用编码规范**（`.claude/rules/coding-standards.mdc`，如存在）— 兜底

当个人风格与项目规范冲突时，优先遵循项目规范以确保团队协作一致性，同时可在注释中注明个人偏好。

---

## 项目架构

```
server/
├── src/
│   ├── app.ts                # 入口：中间件注册、路由挂载、启动
│   ├── config/                # 环境配置读取
│   ├── db/                    # MySQL 连接与初始化
│   ├── middlewares/           # auth（JWT鉴权）/ response（res.success/res.fail）/ errorHandler
│   ├── routes/                # 路由定义（auth/family/dish/order/points/task/reward/health）
│   ├── controllers/            # 请求处理（参数校验 + 调用 service）
│   ├── services/               # 业务逻辑 + 数据库操作
│   ├── utils/                  # jwt / password / asyncHandler
│   └── types/                   # api.ts（接口类型）/ db.ts（数据表类型）
├── tsconfig.json                # strict 模式，路径别名 @/* @config/* 等
└── .env.example                 # 环境变量模板（PORT/DB_*/JWT_*）
```

**分层约定**：`routes/<resource>.ts` → `controllers/<resource>Controller.ts` → `services/<resource>Service.ts`

**请求响应约定**：
- 成功：`res.success(data, message?)`
- 失败：`res.fail(message, statusCode?)`
- controller 统一用 `asyncHandler` 包裹异步函数

---

## 项目代码风格

**来源**：CODE_STYLE.md（code-style-generator 自动生成）

| 规则项 | 项目规范 |
|--------|---------|
| 缩进 | 4 空格 |
| 引号（TS） | 单引号 |
| 分号 | 不写 |
| TS Strict | **true**（tsconfig.json 强制） |
| 文件命名 | camelCase（authController.ts） |
| 注释 | JSDoc 风格，注明 HTTP method + path + Body |
| 错误处理 | asyncHandler 统一包裹，关键位置 try-catch |

**建议补充**：.editorconfig / .prettierrc / eslint 配置（当前无，与 fe 子项目保持一致为宜）

---

## 个人开发风格

**来源**：CODE_STYLE_PERSONAL.md（跨项目复用自 fe/CODE_STYLE_PERSONAL.md，K4 模式复用）

| 规则项 | 个人偏好 |
|--------|---------|
| **缩进** | 4 空格 |
| **引号（TS/JS）** | 单引号 |
| **带变量字符串** | 模板字符串（反引号） |
| **分号** | 不需要 |
| **变量/函数命名** | camelCase |
| **常量命名** | UPPER_SNAKE_CASE |
| **TS strict** | 看情况（server 项目已强制 true） |
| **interface vs type** | 两者结合 |
| **async/await 错误处理** | 关键位置处理 |
| **Git commit 格式** | 简短前缀（feat: / fix: / docs:） |

---

## AI 禁止红线

**重要**：以下行为严格禁止，无论任何情况均不可执行：

### 安全禁区
- **禁止**：生成恶意代码、病毒、木马、后门程序
- **禁止**：生成 XSS、SQL 注入、CSRF 等安全漏洞代码
- **禁止**：在代码中植入隐藏的恶意逻辑或未声明的后门
- **禁止**：生成钓鱼页面、仿冒登录等欺诈性界面

### 数据与凭证红线
- **禁止**：在代码或注释中硬编码密码、API Key、Token 等敏感凭证（尤其是 JWT_SECRET / DB_PASSWORD）
- **禁止**：将 .env、credentials.json 等敏感文件提交到版本控制
- **禁止**：生成泄露用户隐私或企业机密的代码逻辑

### 破坏性操作
- **禁止**：未经用户确认执行 `git reset --hard`、`git push --force` 等破坏性命令
- **禁止**：未经用户确认执行 `rm -rf`、清空数据库表等不可逆操作（尤其是对 MySQL 数据表）
- **禁止**：自动删除未备份的重要文件或代码

### 越权与审核
- **禁止**：绕过安全检查（如 `--no-verify`）跳过 Git Hooks
- **禁止**：在未授权情况下访问或修改系统敏感配置
- **禁止**：自行决定提交代码（除非用户明确要求 commit）

### 第三方交互
- **禁止**：未经用户确认向外部服务发送数据或上传文件
- **禁止**：在未验证 URL 真实性的情况下访问外部链接

---

**由 cheers skill 生成** | **生成时间**：2026-10-15
**已生成文件**：CLAUDE.md ✓、CODE_STYLE.md ✓、CODE_STYLE_PERSONAL.md ✓（复用 fe）
