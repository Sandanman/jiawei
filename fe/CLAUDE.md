# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目信息

- **项目名称**：jiawei（家味小札）
- **技术栈**：uni-app + Vue 3.4.0 + TypeScript 5.4.0 + Vite 5.2.0 + SCSS
- **目标平台**：微信小程序（mp-weixin）+ H5
- **包管理器**：npm
- **关键配置**：tsconfig.json（strict: true）、vite.config.ts、pages.json、manifest.json

---

## 常用命令

```bash
# 开发
npm run dev:mp-weixin    # 微信小程序开发模式
npm run dev:h5           # H5 开发模式

# 构建
npm run build:mp-weixin  # 构建微信小程序
npm run build:h5         # 构建 H5
```

**提示**：运行 `dev:mp-weixin` 后，需在微信开发者工具中导入 `dist/dev/mp-weixin` 目录。

---

## 代码生成优先级（cheers 初始化写入）

**重要**：生成代码时优先使用以下风格：

1. **个人开发风格**（CODE_STYLE_PERSONAL.md）— 最高优先级
2. **项目代码风格**（CODE_STYLE.md）— 次优先级
3. **通用编码规范**（`.claude/rules/coding-standards.mdc`）— 兜底

当个人风格与项目规范冲突时，优先遵循项目规范以确保团队协作一致性，同时可在注释中注明个人偏好。

---

## 项目架构

```
jiawei/
├── src/
│   ├── App.vue              # 应用根组件（onLaunch/onShow/onHide 生命周期）
│   ├── main.ts              # 入口文件（createSSRApp）
│   ├── pages.json           # uni-app 路由配置
│   ├── manifest.json        # uni-app 应用配置（微信小程序 / H5）
│   ├── uni.scss             # 全局 SCSS 变量（颜色、文本、边框等）
│   ├── pages/              # 页面目录
│   │   ├── login/           # 登录
│   │   ├── mock-login/      # 模拟登录
│   │   ├── family/          # 家庭（select 选择家庭）
│   │   ├── members/        # 成员管理（index/detail/invite/role）
│   │   ├── menu/           # 菜单
│   │   ├── order/          # 点餐
│   │   ├── orders/         # 订单中心
│   │   ├── points/         # 积分管理
│   │   ├── profile/        # 个人中心
│   │   └── tasks/          # 任务
│   ├── style/
│   │   └── index.scss       # 全局样式
│   └── static/              # 静态资源（待创建）
├── public/                  # Vite 静态资源目录
├── index.html               # H5 入口 HTML
├── vite.config.ts           # Vite 配置（含 @ 别名）
├── tsconfig.json            # TypeScript 配置（strict 模式，paths 别名）
└── package.json             # 依赖管理（uni-app + Vue 3 + TypeScript）
```

**uni-app 关键路径约定**：
- 页面：`src/pages/<name>/index.vue`
- 组件：`src/components/<name>.vue`
- API：`src/api/`（待创建）
- 工具函数：`src/utils/`（待创建）
- 样式变量：`src/uni.scss`

---

## 项目代码风格

**来源**：CODE_STYLE.md（code-style-generator 自动生成）

| 规则项 | 项目规范 |
|--------|---------|
| 缩进 | 2 空格（推断值，无配置文件） |
| 引号（TS） | 双引号 |
| 分号 | 未强制 |
| TS Strict | **true**（tsconfig.json 强制） |
| Script 风格 | `<script setup lang="ts">`（Composition API） |
| Props 定义 | `defineProps<Props>()` + TypeScript 类型 |
| 样式隔离 | `scoped` |
| CSS 类名 | kebab-case |
| 模板组件标签 | uni-app 内置（view / text） |

**建议补充**：.editorconfig / .prettierrc / eslint 配置

---

## 个人开发风格

**来源**：CODE_STYLE_PERSONAL.md（personal-code-habits-generator 对话收集）

| 规则项 | 个人偏好 |
|--------|---------|
| **缩进** | 4 空格 |
| **引号（TS/JS）** | 单引号 |
| **引号（HTML 属性）** | 双引号 |
| **带变量字符串** | 模板字符串（反引号） |
| **分号** | 不需要 |
| **行长度** | 无限制 |
| **变量/函数命名** | camelCase |
| **常量命名** | UPPER_SNAKE_CASE |
| **文件名** | kebab-case |
| **CSS 类名** | kebab-case |
| **TS strict** | 看情况（按项目配置） |
| **interface vs type** | 两者结合 |
| **Props 定义** | `defineProps` + TypeScript 类型 |
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
- **禁止**：在代码或注释中硬编码密码、API Key、Token 等敏感凭证
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

**由 cheers skill 生成** | **生成时间**：2026-06-06
**已生成文件**：CLAUDE.md ✓、CODE_STYLE.md ✓、CODE_STYLE_PERSONAL.md ✓