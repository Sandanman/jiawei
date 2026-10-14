# 登录功能设计规范

## 1. 概述

本文档定义「家味小札」小程序的登录功能设计，包括微信小程序端和 H5 端的登录流程、用户角色、路由控制和状态管理。

**项目基础**：uni-app + Vue 3.4.0 + TypeScript 5.4.0
**状态管理**：Pinia
**路由方案**：uni-app 内置路由（pages.json）+ 条件跳转

---

## 2. 登录流程设计

### 2.1 微信小程序端

#### 入口
- 扫码：扫描家庭分享二维码或小程序码
- 搜索：在微信中搜索「家味小札」小程序

#### 登录页（login/index.vue）

页面展示两个按钮选项：

| 按钮 | 行为 |
|------|------|
| 管理员登陆 | 调用 `uni.getUserProfile` 获取微信昵称和头像 → 跳转管理员首页 |
| 加入家庭 | 调用 `uni.scanCode` 打开扫码 → 扫描家庭二维码 → 弹出确认框 → 加入成功 → 跳转成员首页 |

**管理员登录流程：**
```
点击"管理员登陆"
    → uni.getUserProfile（获取微信昵称、头像）
    → 存储到 userStore（isAdmin: true, isLogin: true）
    → 跳转 /pages/admin/home/index
```

**加入家庭流程：**
```
点击"加入家庭"
    → uni.scanCode（打开扫码）
    → 识别家庭二维码内容（包含 familyId）
    → 弹出确认框："是否确认加入该家庭？"
        ├── 确认 → 调用家庭成员接口 → 存储到 userStore（isAdmin: false, isLogin: true）
        │        → 跳转 /pages/member/home/index
        └── 取消 → 停留在登录页
```

#### 管理员首页（admin/home.vue）
- 仅管理员可访问
- 显示家庭管理功能（成员管理、食谱管理、家庭设置等）
- 顶部显示管理员昵称和头像

#### 成员首页（member/home.vue）
- 已加入家庭的成员可访问
- 显示家庭共享内容（食谱、成员等）
- 顶部显示成员昵称

### 2.2 H5 端

#### Mock 登录页（mock-login/index.vue）

| 账号 | 密码 | 跳转 |
|------|------|------|
| admin | admin | 管理员首页 |
| user | user | 成员首页 |

**Mock 登录流程：**
```
输入账号密码
    → 校验（admin/admin 或 user/user）
        ├── 正确 → 存储到 userStore（role: 'admin' / 'member'，isLogin: true）
        │         → 跳转对应首页
        └── 错误 → 提示"账号或密码错误"
```

#### H5 路由守卫
- 未登录访问受保护页面 → 跳转 /pages/mock-login/index
- 已登录访问登录页 → 跳转对应首页

---

## 3. 用户角色设计

### 3.1 角色定义

| 角色 | 英文标识 | 说明 | 登录方式 |
|------|---------|------|---------|
| 管理员 | admin | 家庭创建者，拥有全部管理权限 | 小程序：微信授权 / H5：admin/admin |
| 成员 | member | 家庭成员，仅查看和参与 | 小程序：扫码加入 / H5：user/user |

### 3.2 权限矩阵

| 功能 | 管理员 | 成员 |
|------|--------|------|
| 查看家庭内容 | ✅ | ✅ |
| 管理成员 | ✅ | ❌ |
| 管理食谱 | ✅ | ❌ |
| 家庭设置 | ✅ | ❌ |
| 加入/退出家庭 | — | ✅ |

---

## 4. 用户信息存储（Pinia）

### 4.1 userStore 结构

```typescript
// src/stores/user.ts
interface UserState {
    isLogin: boolean       // 是否已登录
    role: 'admin' | 'member' | ''  // 用户角色
    nickname: string      // 昵称（小程序端为微信昵称）
    avatar: string        // 头像 URL
    familyId: string      // 家庭 ID（成员）
    userId: string        // 用户唯一标识
    token: string         // 认证令牌（Mock 为固定值）
}
```

### 4.2 userStore Actions

```typescript
// 管理员登录
adminLogin(nickname: string, avatar: string): void

// 成员加入家庭
memberJoin(familyId: string, nickname: string, avatar: string): void

// H5 Mock 登录
mockLogin(account: string, password: string): Promise<boolean>

// 退出登录
logout(): void

// 检查登录状态
checkLogin(): boolean
```

---

## 5. 页面结构

```
src/
├── pages/
│   ├── login/                    # 登录页（小程序）
│   │   └── index.vue
│   ├── mock-login/               # Mock 登录页（H5）
│   │   └── index.vue
│   ├── admin/
│   │   └── home/                 # 管理员首页
│   │       └── index.vue
│   └── member/
│       └── home/                 # 成员首页
│           └── index.vue
└── stores/
    └── user.ts                   # 用户状态管理
```

**pages.json 路由配置：**
```json
{
    "pages": [
        { "path": "pages/login/index" },
        { "path": "pages/mock-login/index" },
        { "path": "pages/admin/home/index" },
        { "path": "pages/member/home/index" }
    ]
}
```

---

## 6. 技术实现要点

### 6.1 小程序端微信登录

```typescript
// 获取微信昵称
uni.getUserProfile({
    desc: '用于完善用户资料',
    success: (res) => {
        const { nickName, avatarUrl } = res.userInfo
        userStore.adminLogin(nickName, avatarUrl)
        uni.navigateTo({ url: '/pages/admin/home/index' })
    }
})
```

### 6.2 扫码加入家庭

```typescript
// 扫码
uni.scanCode({
    onlyFromCamera: true,
    success: (res) => {
        const { familyId, familyName } = JSON.parse(res.result)
        uni.showModal({
            title: '加入家庭',
            content: `是否确认加入「${familyName}」？`,
            success: (modal) => {
                if (modal.confirm) {
                    userStore.memberJoin(familyId, nickname, avatar)
                    uni.switchTab({ url: '/pages/member/home/index' })
                }
            }
        })
    }
})
```

### 6.3 H5 Mock 登录

```typescript
// mock-login/index.vue
const handleLogin = () => {
    if (account.value === 'admin' && password.value === 'admin') {
        userStore.mockLogin('admin', 'admin')
        uni.reLaunch({ url: '/pages/admin/home/index' })
    } else if (account.value === 'user' && password.value === 'user') {
        userStore.mockLogin('user', 'user')
        uni.reLaunch({ url: '/pages/member/home/index' })
    } else {
        uni.showToast({ title: '账号或密码错误', icon: 'none' })
    }
}
```

---

## 7. 家庭二维码规范

**二维码内容（JSON）：**
```json
{
    "type": "family",
    "familyId": "FAML_xxxxx",
    "familyName": "家味小札"
}
```

---

**设计版本**：v1.0
**最后更新**：2026-06-06