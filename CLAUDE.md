# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目信息

- **项目名称**：jiawei（家味小札）
- **仓库结构**：monorepo，包含前端（`fe/`）与后端（`server/`）两个独立子项目
- **技术栈总览**：
  - 前端：uni-app + Vue 3.4.0 + TypeScript + Vite（微信小程序 + H5）
  - 后端：Express 4.19.2 + TypeScript + MySQL（mysql2）+ JWT
- **包管理器**：npm（根目录仅作任务编排，无独立依赖）

---

## 常用命令

```bash
# 根目录（同时启动前后端）
npm run dev          # 并行启动 fe:dev + server:dev

# 单独启动
npm run fe:dev        # cd fe && npm run dev:h5
npm run server:dev    # cd server && npm run dev
```

子项目各自有更完整的命令（详见 `fe/CLAUDE.md` 与 `server/CLAUDE.md`）。

---

## 代码生成优先级（cheers 初始化写入）

**重要**：生成代码时优先使用以下风格：

1. **个人开发风格**（各子项目 CODE_STYLE_PERSONAL.md）— 最高优先级，跨项目保持一致
2. **项目代码风格**（各子项目 CODE_STYLE.md）— 次优先级，前后端分别规范
3. **通用编码规范**（`.claude/rules/coding-standards.mdc`，如存在）— 兜底

当个人风格与项目规范冲突时，优先遵循项目规范以确保团队协作一致性，同时可在注释中注明个人偏好。

**重要**：fe 与 server 技术栈不同（前端 Vue/uni-app vs 后端 Express），生成代码时需先确认所在子项目，再参考对应的 CLAUDE.md / CODE_STYLE.md。

---

## 项目架构

```
jiawei/
├── fe/                 # 前端子项目（uni-app + Vue3 + TS）
│   ├── CLAUDE.md        # 前端专属指引
│   ├── CODE_STYLE.md
│   ├── CODE_STYLE_PERSONAL.md
│   └── src/
├── server/             # 后端子项目（Express + TS + MySQL）
│   ├── CLAUDE.md        # 后端专属指引
│   ├── CODE_STYLE.md
│   ├── CODE_STYLE_PERSONAL.md
│   └── src/
└── package.json        # 根目录任务编排（fe:dev / server:dev / dev）
```

**子项目详情**：
- 前端架构、页面路由、组件约定 → 见 `fe/CLAUDE.md`
- 后端分层架构、接口约定、响应格式 → 见 `server/CLAUDE.md`

---

## 个人开发风格（跨项目统一）

| 规则项 | 个人偏好 |
|--------|---------|
| **缩进** | 4 空格 |
| **引号（TS/JS）** | 单引号 |
| **带变量字符串** | 模板字符串（反引号） |
| **分号** | 不需要 |
| **变量/函数命名** | camelCase |
| **常量命名** | UPPER_SNAKE_CASE |
| **interface vs type** | 两者结合 |
| **async/await 错误处理** | 关键位置处理（不需要每处都 try-catch） |
| **Git commit 格式** | 简短前缀（feat: / fix: / docs:） |

> 该偏好由 fe 子项目首次通过 personal-code-habits-generator 对话收集，server 子项目复用（K4 模式复用）。

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
- **禁止**：未经用户确认执行 `rm -rf`、清空数据库表等不可逆操作
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
**子项目状态**：fe（已有完整配置，2026-06-06 生成）、server（本次新生成）
