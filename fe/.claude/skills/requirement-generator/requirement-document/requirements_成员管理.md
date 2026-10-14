# 需求拆分文档 - 成员管理模块

> 生成时间：2026-06-06
> 需求编号：FEATURE-002
> 模块名称：成员管理（Member Management）
> 优先级：P0

---

## 一、需求总览

| 维度 | 内容 |
|------|------|
| 需求概述 | 实现家庭成员管理系统，支持管理员对成员的完整管理（邀请、备注、移除、角色设置），以及用户登录时的多家庭选择和多角色TabBar |
| 涉及角色 | 主管理员、普通管理员、普通用户 |
| 功能模块数 | 2个大模块，9个子功能点 |
| API需求 | 新增约5-7个接口 |
| 页面需求 | 约4-6个页面 |

---

## 二、功能模块拆分

### 模块 A：管理员成员管理（2.1）

#### A1. 邀请成员加入

**功能描述：**
- 管理员可以通过手机号或邀请码邀请新成员加入家庭
- 被邀请的成员加入时需要输入自己的备注（自我介绍）

**用户流程：**
```
管理员点击"邀请成员"
  → 选择邀请方式（手机号 / 邀请码）
  → 输入手机号或生成邀请码
  → 发送邀请
  → 成员收到邀请通知
  → 成员点击加入，填写备注
  → 管理员审核确认（可选）
  → 成员加入成功
```

**字段设计：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| invite_code | string | 邀请码（6位数字/字母） |
| invite_type | enum | mobile / code |
| target_mobile | string | 被邀请人手机号 |
| member_remark | string | 成员自填备注（加入时填写） |
| expire_time | datetime | 邀请码过期时间 |
| status | enum | pending / accepted / expired |

**API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| /api/family/invite | POST | 创建邀请（生成邀请码或手机号邀请） |
| /api/family/join | POST | 成员加入（携带邀请码+备注） |
| /api/family/invite/list | GET | 获取邀请记录列表 |

---

#### A2. 成员备注管理

**功能描述：**
- 管理员可以为家庭成员设置/修改备注名
- 备注名仅对管理员可见，用于识别成员

**字段设计：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| member_id | int | 成员用户ID |
| admin_remark | string | 管理员设置的备注（最大20字符） |

**API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| /api/family/member/{id}/remark | PUT | 更新成员备注 |

---

#### A3. 移除成员

**功能描述：**
- 管理员可以将成员从家庭中移除
- 被移除的成员会收到通知
- 主管理员不可被移除

**用户流程：**
```
管理员进入成员列表
  → 点击成员操作按钮
  → 选择"移除成员"
  → 确认移除（二次确认弹窗）
  → 移除成功，成员收到通知
```

**API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| /api/family/member/{id} | DELETE | 移除家庭成员 |

---

#### A4. 成员角色设置

**功能描述：**
- 管理员可以将普通用户设置为管理员
- 管理员可以降级为普通用户
- **主管理员角色不可修改**（系统保留）

**角色类型：**

| 角色 | 角色值 | 说明 |
|------|--------|------|
| 主管理员 | owner | 家庭创建者，不可修改角色，不可移除 |
| 管理员 | admin | 可管理成员，不可修改他人角色 |
| 普通用户 | member | 家庭成员，无管理权限 |

**业务规则：**
1. 主管理员（owner）的角色不可修改
2. 每个家庭至少保留1个主管理员
3. 角色变更后，被变更用户收到通知

**API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| /api/family/member/{id}/role | PUT | 更新成员角色 |

**请求体：**
```json
{
  "role": "admin" | "member"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "member_id": 123,
    "role": "admin",
    "updated_at": "2026-06-06T10:00:00Z"
  }
}
```

---

#### A5. 管理员 TabBar

**功能描述：**
- 管理员登录成功后显示管理员专属底部导航栏

**TabBar 配置：**

| Tab | 图标 | 路由 | 优先级 |
|-----|------|------|--------|
| 菜单 | menu-icon | /pages/menu/index | P0 |
| 成员管理 | members-icon | /pages/members/index | P0 |
| 积分管理 | points-icon | /pages/points/index | P1（待开发占位） |
| 个人中心 | profile-icon | /pages/profile/index | P0 |

**页面清单：**

| 页面 | 路由 | 功能 |
|------|------|------|
| 菜单页 | /pages/menu/index | 家庭菜单管理 |
| 成员管理页 | /pages/members/index | 成员列表、邀请、移除、角色设置 |
| 积分管理页（占位） | /pages/points/index | 开发中提示页 |
| 个人中心页 | /pages/profile/index | 个人信息、设置、退出登录 |

---

### 模块 B：用户登录与家庭选择（2.2）

#### B1. 多家庭管理员选择

**功能描述：**
- 当用户是多个家庭的管理员时，登录后显示家庭选择列表
- 用户选择以哪个家庭的管理员身份进入
- 选择后进入该家庭的管理员视角

**用户流程：**
```
用户登录
  → 系统判断用户是否是多家庭管理员
  → 是：显示家庭选择列表
    → 用户选择家庭
    → 进入该家庭管理员视角（显示管理员TabBar）
  → 否：直接进入对应身份首页
```

**数据模型：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| family_id | int | 家庭ID |
| family_name | string | 家庭名称 |
| user_role | enum | owner / admin / member |
| member_count | int | 成员数量 |
| is_current | boolean | 是否当前选中 |

**API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| /api/user/families | GET | 获取用户所属的所有家庭列表 |

**响应体：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "family_id": 1,
      "family_name": "张三家庭",
      "user_role": "owner",
      "member_count": 4
    },
    {
      "family_id": 2,
      "family_name": "李四家庭",
      "user_role": "admin",
      "member_count": 3
    }
  ]
}
```

---

#### B2. 普通用户 TabBar

**功能描述：**
- 普通用户登录成功后显示用户专属底部导航栏

**TabBar 配置：**

| Tab | 图标 | 路由 | 优先级 |
|-----|------|------|--------|
| 点餐 | order-icon | /pages/order/index | P0 |
| 订单中心 | orders-icon | /pages/orders/index | P0 |
| 任务 | tasks-icon | /pages/tasks/index | P1（待开发占位） |
| 个人中心 | profile-icon | /pages/profile/index | P0 |

**页面清单：**

| 页面 | 路由 | 功能 |
|------|------|------|
| 点餐页 | /pages/order/index | 点餐功能 |
| 订单中心页 | /pages/orders/index | 订单列表、订单详情 |
| 任务页（占位） | /pages/tasks/index | 开发中提示页 |
| 个人中心页 | /pages/profile/index | 个人信息、设置、退出登录 |

---

## 三、数据模型设计

### 家庭成员表（family_members）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| family_id | bigint | 家庭ID |
| user_id | bigint | 用户ID |
| role | enum | owner / admin / member |
| member_remark | string | 成员自填备注 |
| admin_remark | string | 管理员设置的备注 |
| joined_at | datetime | 加入时间 |
| status | enum | active / removed |

### 邀请记录表（family_invites）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| family_id | bigint | 家庭ID |
| invite_code | string | 邀请码 |
| invite_type | enum | mobile / code |
| target_mobile | string | 目标手机号 |
| inviter_id | bigint | 邀请人ID |
| status | enum | pending / accepted / expired / cancelled |
| expire_at | datetime | 过期时间 |
| created_at | datetime | 创建时间 |

---

## 四、页面与路由设计

### 管理员页面

| 页面 | 路由 | 文件位置 |
|------|------|----------|
| 成员管理页 | /pages/members/index | src/pages/members/index.vue |
| 邀请成员弹窗 | /pages/members/invite | src/pages/members/invite.vue |
| 成员详情弹窗 | /pages/members/detail | src/pages/members/detail.vue |
| 设置角色弹窗 | /pages/members/role | src/pages/members/role.vue |

### 用户页面

| 页面 | 路由 | 文件位置 |
|------|------|----------|
| 家庭选择页 | /pages/family/select | src/pages/family/select.vue |
| 点餐页 | /pages/order/index | src/pages/order/index.vue |
| 订单中心页 | /pages/orders/index | src/pages/orders/index.vue |
| 任务页（占位） | /pages/tasks/index | src/pages/tasks/index.vue |

---

## 五、业务规则汇总

| 规则编号 | 规则内容 | 优先级 |
|---------|---------|--------|
| BR-001 | 主管理员（owner）角色不可修改 | 必须 |
| BR-002 | 每个家庭至少保留1个主管理员 | 必须 |
| BR-003 | 被移除的成员会收到通知 | 建议 |
| BR-004 | 角色变更后，被变更用户收到通知 | 建议 |
| BR-005 | 邀请码有效期为7天 | 建议 |
| BR-006 | 管理员备注最大20字符 | 必须 |
| BR-007 | 成员自填备注最大50字符 | 必须 |

---

## 六、待开发占位页面

| 页面 | 状态 | 说明 |
|------|------|------|
| 积分管理 | 待开发 | 显示"功能开发中"提示 |
| 任务 | 待开发 | 显示"功能开发中"提示 |

---

## 七、依赖关系

### 前端依赖

| 依赖 | 说明 |
|------|------|
| uni-app | 跨平台框架 |
| pinia | 状态管理（用于存储当前家庭、用户角色等） |
| uni-ui | UI组件库（可选） |

### 后端依赖

| 依赖 | 说明 |
|------|------|
| 用户服务 | 获取用户信息、角色信息 |
| 家庭服务 | 家庭CRUD、成员管理 |
| 邀请服务 | 邀请码生成、邀请记录 |

---

## 八、测试要点

| 测试点 | 测试内容 |
|--------|---------|
| 邀请功能 | 手机号邀请、邀请码邀请、过期邀请码 |
| 加入功能 | 正确填写备注、备注长度校验 |
| 备注管理 | 管理员备注修改、备注显示 |
| 移除成员 | 移除普通成员、主管理员不可移除 |
| 角色设置 | 普通→管理员、管理员→普通、主管理员不可改 |
| 多家庭选择 | 多家庭显示、单家庭直接进入 |
| TabBar切换 | 管理员/普通用户TabBar正确显示 |