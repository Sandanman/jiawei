# 管理后台（admin-console）- API 接口文档

- 版本：v1.0
- 创建日期：2026-11-23
- 任务 ID：20261123-003
- 状态：需求阶段设计稿，字段以实现时的 `server/src/types/api.ts` 为准

## 通用约定

| 项 | 约定 |
|---|---|
| 前缀 | `/api/admin`，在 `app.ts` 中于 `notFound` 之前挂载 |
| 认证 | 请求头 `Authorization: Bearer <adminToken>`。登录接口除外 |
| 未登录 | HTTP 401，`{code: 401, message, data: null}`（与业务端 `authRequired` 一致） |
| 成功 | `{code: 0, message: 'ok', data}` |
| 业务错误 | HTTP 200，`{code: -1, message, data: null}`（与 `res.fail` 一致） |
| 分页请求 | `page`（默认 1）、`pageSize`（默认 20，最大 100） |
| 分页响应 | `data: {list, total, page, pageSize}` |
| 高危接口 | `POST /…/{动作}`，请求体必带 `reason`（4–200 字） |
| 时间格式 | `YYYY-MM-DD HH:mm:ss`，服务端时区 |
| 命名 | 请求与响应字段均用 camelCase，库字段用 snake_case，由 service 层转换 |

调用方均为"后台前端（admin/）"，下文不再逐条重复。

## 1. 认证（F1）

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/auth/login` | 登录 | 否 |
| GET | `/auth/me` | 当前管理员信息 | 是 |
| PUT | `/auth/password` | 修改密码 | 是 |

**POST `/auth/login`**

- 请求：`{username: string, password: string}`
- 响应：`{token: string, expiresIn: number, admin: {id, username, nickname}}`
- 错误：`账号或密码错误`；`账号已锁定，请 N 分钟后重试`；`账号已被禁用`
- 副作用：成功时清零 `failed_count`，更新 `last_login_at`，写审计 `auth.login`；失败时 `failed_count + 1`，达 5 次设置 `locked_until`
- 依赖：`admin_user`、`utils/password`、`ADMIN_JWT_SECRET`

**GET `/auth/me`**

- 响应：`{id, username, nickname, lastLoginAt}`

**PUT `/auth/password`**

- 请求：`{oldPassword, newPassword}`
- 响应：`{}`（成功后当前 token 立即失效，需重新登录）
- 错误：`旧密码错误`；`新密码不能与旧密码相同`；`密码需 8–64 位且同时包含字母和数字`
- 副作用：`token_version + 1`，写审计 `auth.change_password`

登出由前端清除 token 实现，服务端不提供接口。

## 2. 家庭（F2）

| 方法 | 路径 | 说明 | 优先级 |
|---|---|---|---|
| GET | `/families` | 列表与搜索 | P1 |
| GET | `/families/:id` | 详情 | P1 |
| PUT | `/families/:id` | 编辑名称、描述 | P1 |
| GET | `/families/:id/close-impact` | 注销前影响范围 | P1 |
| POST | `/families/:id/close` | 注销（高危） | P1 |
| POST | `/families/:id/restore` | 恢复（高危） | P1 |
| PUT | `/families/:id/members/:userId` | 修改成员角色 | P2 |
| POST | `/families/:id/members/:userId/remove` | 移除成员（高危） | P2 |

**GET `/families`**

- 查询：`keyword?`（家庭名、家庭编码、房主昵称、房主手机号）、`status?`（`1` / `0`，缺省为全部）、`page?`、`pageSize?`
- 响应项：`{id, familyCode, familyName, ownerId, ownerNickname, ownerPhone(脱敏), status, memberCount, dishCount, orderCount, createdAt}`

**GET `/families/:id`**

- 响应：`{id, familyCode, familyName, description, ownerId, status, createdAt, updatedAt, members: [{userId, nickname, phone, role, points, adminRemark, joinedAt}], stats: {dishCount, orderCount, taskCount, rewardCount}}`
- 错误：`家庭不存在`

**PUT `/families/:id`**

- 请求：`{familyName?: string(1-64), description?: string(0-255)}`
- 响应：`{}`
- 错误：`没有可更新的内容`；`家庭不存在`
- 审计：`family.update`，`before_data` / `after_data` 记录变更字段

**GET `/families/:id/close-impact`**

- 响应：`{memberCount, openOrderCount, openTaskCount, pendingRewardOrderCount}`
- 其中 `openOrderCount` 指 `pending / confirmed` 订单数，`openTaskCount` 指 `published / paused` 任务数，`pendingRewardOrderCount` 指 `pending` 兑换数。

**POST `/families/:id/close`、`/restore`**

- 请求：`{reason: string(4-200)}`
- 响应：`{}`
- 错误：`家庭已注销`（对已注销再注销）；`家庭未注销`（对正常家庭恢复）；`请填写操作原因`；`家庭不存在`
- 实现：`UPDATE family SET status = ? WHERE id = ? AND status = ?`，影响行数为 0 视为状态已变更
- 审计：`family.close` / `family.restore`，`before_data: {status}`、`after_data: {status}`
- 依赖：D2 上线后，注销才对成员生效

**PUT `/families/:id/members/:userId`（P2）**

- 请求：`{role: 'admin' | 'member'}`
- 错误：`不能修改房主角色`；`成员不存在`
- 审计：`family.member.role`

**POST `/families/:id/members/:userId/remove`（P2）**

- 请求：`{reason}`
- 响应：`{removedPoints: number}`（被清除的家庭内积分）
- 错误：`不能移除房主`；`成员不存在`
- 审计：`family.member.remove`，`before_data` 含角色与积分余额

成员角色以 `family_member.role`（`owner / admin / member`）为准。判断房主时同时检查 `role = 'owner'` 与 `is_owner = 1`，任一成立都视为房主。

## 3. 菜品（F3）

| 方法 | 路径 | 说明 | 优先级 |
|---|---|---|---|
| GET | `/dishes` | 列表与搜索（跨家庭） | P1 |
| GET | `/dishes/:id` | 详情 | P1 |
| PUT | `/dishes/:id` | 编辑 | P1 |
| PATCH | `/dishes/:id/publish` | 上架 / 下架 | P1 |
| POST | `/dishes/:id/delete` | 删除（高危） | P1 |
| POST | `/dishes/batch-publish` | 批量上下架 | P2 |

**GET `/dishes`**

- 查询：`familyId?`、`keyword?`（菜品名）、`category?`、`isPublished?`（`1` / `0`）、`soldOut?`（`1` 表示 `stock = 0`）、`page?`、`pageSize?`
- 响应项：`{id, familyId, familyName, name, description, price, points, category, imageUrl, stock, isPublished, sortOrder, createdAt, updatedAt}`

**PUT `/dishes/:id`**

- 请求：`{name?(1-64), description?(≤512), price?(≥0,两位小数), points?(≥0整数), category?(≤32), imageUrl?(≤512,http/https), stock?(≥0整数), sortOrder?(≥0整数)}`
- 错误：`没有可更新的内容`；`菜品不存在`；`价格不合法` 等字段级提示
- 审计：`dish.update`，记录变更字段前后值

**PATCH `/dishes/:id/publish`**

- 请求：`{isPublished: boolean}`
- 审计：`dish.publish`

**POST `/dishes/:id/delete`**

- 请求：`{reason}`
- 响应：`{}`
- 拒绝时：`code -1`，`message: '该菜品仍被引用，请先下架'`，`data: {rewardCount, openOrderCount}`
- 检查：`SELECT COUNT(*) FROM reward WHERE dish_id = ?`；`order_item` 联 `order` 统计 `status IN ('pending','confirmed')` 的订单数
- 审计：`dish.delete`，`before_data` 保存被删菜品的完整字段，便于人工还原

**POST `/dishes/batch-publish`（P2）**

- 请求：`{ids: number[](1-100), isPublished: boolean}`
- 响应：`{success: number[], failed: [{id, message}]}`，逐条处理，不整体回滚
- 审计：每个成功对象一条 `dish.publish`

## 4. 用户与账号（F4）

| 方法 | 路径 | 说明 | 优先级 |
|---|---|---|---|
| GET | `/users` | 列表与搜索 | P1 |
| GET | `/users/:id` | 详情 | P1 |
| POST | `/users/:id/disable` | 禁用（高危） | P1 |
| POST | `/users/:id/enable` | 启用（高危） | P1 |
| POST | `/users/:id/reset-password` | 重置密码（高危） | P1 |

**GET `/users`**

- 查询：`keyword?`（用户 ID、昵称、手机号、`account.username`）、`status?`、`createdFrom?`、`createdTo?`、`page?`、`pageSize?`
- 响应项：`{id, nickname, avatarUrl, phone(脱敏), status, regionName, familyCount, createdAt}`

**GET `/users/:id`**

- 响应：`{id, nickname, avatarUrl, phone, status, regionCode, regionName, regionSource, createdAt, account: {username, loginType, status, lastLoginAt} | null, families: [{familyId, familyName, familyStatus, role, points}]}`

**POST `/users/:id/disable`、`/enable`**

- 请求：`{reason}`
- 响应：`{ownedFamilies: [{id, familyName}]}`（仅 `disable` 返回，用于前端展示该用户是哪些家庭的房主）
- 错误：`用户已禁用`；`用户未禁用`；`用户不存在`
- 审计：`user.disable` / `user.enable`
- 依赖：D1 上线后禁用对已登录用户立即生效

**POST `/users/:id/reset-password`**

- 请求：`{reason}`
- 响应：`{username, newPassword}`（明文仅此一次返回，不入库、不入日志、不入审计）
- 错误：`该用户没有可重置的账号`；`用户不存在`
- 审计：`user.reset_password`，`before_data` / `after_data` 为空

## 5. 订单与兑换记录（F5）

| 方法 | 路径 | 说明 | 优先级 |
|---|---|---|---|
| GET | `/orders` | 订单列表 | P1 |
| GET | `/orders/:id` | 订单详情 | P1 |
| POST | `/orders/:id/cancel` | 强制取消（高危） | P1 |
| GET | `/reward-orders` | 兑换记录列表 | P1 |
| GET | `/reward-orders/:id` | 兑换记录详情 | P1 |
| POST | `/reward-orders/:id/cancel` | 撤销兑换（高危） | P1 |

**GET `/orders`**

- 查询：`familyId?`、`userId?`、`orderNo?`、`status?`（`pending / confirmed / completed / cancelled`）、`createdFrom?`、`createdTo?`、`page?`、`pageSize?`
- 响应项：`{id, orderNo, familyId, familyName, userId, nickname, totalAmount, totalPoints, status, remark, createdAt}`

**GET `/orders/:id`**

- 响应：列表项字段加 `items: [{dishId, dishName, dishImageUrl, price, points, quantity, subtotal}]` 与 `pointsRecords: [{id, pointsChange, pointsBalance, type, description, createdAt}]`

**POST `/orders/:id/cancel`**

- 请求：`{reason}`
- 响应：`{refundedPoints: number}`
- 错误：`订单状态不允许取消`；`订单状态已变更`；`下单用户已不在该家庭，无法退还积分`；`订单不存在`
- 事务：条件更新状态 → 归还库存 → 退积分（`FOR UPDATE`）→ 写 `points_record` → 写审计
- 审计：`order.cancel`

**POST `/reward-orders/:id/cancel`**

- 请求：`{reason}`
- 响应：`{refundedPoints: number}`
- 错误：`仅待领取状态的兑换可撤销`；`兑换状态变更失败，可能已被处理`
- 审计：`reward_order.cancel`

## 6. 任务、积分与奖励（F6，P2）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/tasks` | 任务列表（只读） |
| GET | `/tasks/:id` | 任务详情（含指派人） |
| GET | `/points-records` | 积分流水 |
| POST | `/points/adjust` | 手动调整积分（高危） |
| GET | `/rewards` | 奖励商品列表 |
| GET | `/rewards/:id` | 奖励商品详情 |
| PATCH | `/rewards/:id/publish` | 上架 / 下架 |
| POST | `/rewards/:id/delete` | 删除奖励（高危） |

**GET `/tasks`**：查询 `familyId?`、`status?`（`draft / published / paused / completed`）、`category?`、`deadlineFrom?`、`deadlineTo?`、分页。响应项 `{id, familyId, familyName, creatorId, title, category, points, deadline, status, createdAt}`。

**GET `/points-records`**：查询 `familyId?`、`userId?`、`type?`（`order_deduct / task_reward / dish_reward / manual_add / manual_subtract`）、`from?`、`to?`、分页。响应项 `{id, userId, nickname, familyId, familyName, pointsChange, pointsBalance, type, referenceType, referenceId, description, createdAt}`。

**POST `/points/adjust`**

- 请求：`{familyId: number, userId: number, direction: 'add' | 'subtract', amount: number(1-100000), reason: string(4-200)}`
- 响应：`{balanceBefore: number, balanceAfter: number}`
- 错误：`成员不存在`；`积分不足，当前余额 N`；`调整数量不合法`；`请填写操作原因`
- 事务（顺序固定）：
  1. `SELECT points FROM family_member WHERE family_id = ? AND user_id = ? FOR UPDATE`
  2. 校验余额，扣减后不得小于 0
  3. 写 `admin_audit_log`，取得日志 ID
  4. `UPDATE family_member SET points = ?`
  5. 写 `points_record`：`type = manual_add / manual_subtract`，`points_change` 带正负号，`reference_type = 'admin'`，`reference_id` = 日志 ID，`description = '[平台调整] ' + reason`（截断到 255 字）
- 审计：`points.adjust`，`before_data: {points}`、`after_data: {points}`
- 不调用 `pointsService.adjustPoints`（C5）

**GET `/rewards`**：查询 `familyId?`、`category?`（`physical / gift / play / dish`）、`isPublished?`、分页。响应项 `{id, familyId, familyName, name, category, points, imageUrl, stock, dishId, isPublished, sortOrder, createdAt}`，`stock` 为 `-1` 表示不限量，`0` 表示售罄。

**PATCH `/rewards/:id/publish`**：请求 `{isPublished}`，审计 `reward.publish`。

**POST `/rewards/:id/delete`**：请求 `{reason}`。已有 `reward_order` 记录时返回 `code -1`、`message: '该奖励已有兑换记录，无法删除，请改为下架'`。审计 `reward.delete`，`before_data` 保存完整字段。

## 7. AI 地域推荐运维（F7，P2）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/region-recommendations` | 各地域指定日期的生成状态 |
| GET | `/region-recommendations/:regionCode` | 某地域某日推荐详情 |
| POST | `/region-recommendations/regenerate` | 重新生成单个地域 |
| POST | `/region-recommendations/run-all` | 手动触发全地域生成（高危，异步） |
| GET | `/region-recommendations/run-all/status` | 全地域生成的进度 |

**GET `/region-recommendations`**

- 查询：`date?`（`YYYY-MM-DD`，默认今天）
- 响应：`{date, list: [{regionCode, regionName, userCount, status: 'success' | 'failed' | 'none', generatedAt}]}`，不分页（地域数量有限）
- 数据来源：`user` 表 `region_code`、`region_name` 非空的去重结果，左联 `daily_region_meal`

**GET `/region-recommendations/:regionCode`**

- 查询：`date?`
- 响应：`{regionCode, regionName, date, status, meals: {breakfast: [{dishName, description}], lunch: [...], dinner: [...]}}`

**POST `/region-recommendations/regenerate`**

- 请求：`{regionCode: string, date?: string}`。`date` 缺省为今天，暂只允许今天（`generateForRegion` 内部固定使用当天日期）
- 响应：`{status: 'success' | 'failed'}`（调用后重新查询结果得出）
- 错误：`该地域今日已生成成功，无需重试`；`该地域正在生成中`；`地域不存在`
- 审计：`region.regenerate`，`target_id = regionCode`

**POST `/region-recommendations/run-all`**

- 请求：`{reason}`
- 响应：`{started: true, total: number}`，立即返回
- 错误：`全地域生成正在运行`（与 03:00 定时任务共用标志）
- 审计：`region.run_all`

**GET `/region-recommendations/run-all/status`**

- 响应：`{running: boolean, startedAt: string | null, total: number, done: number, failed: number}`
- 进度存于进程内存，服务重启后丢失

## 8. 审计日志（F8）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/audit-logs` | 列表与筛选 |
| GET | `/audit-logs/:id` | 详情（含前后值） |

**GET `/audit-logs`**：查询 `adminId?`、`action?`、`targetType?`、`targetId?`、`familyId?`、`from?`、`to?`、分页。响应项 `{id, adminId, adminName, action, targetType, targetId, familyId, reason, ip, createdAt}`，按 `created_at` 倒序。

**GET `/audit-logs/:id`**：在列表项基础上加 `beforeData`、`afterData`。

不提供新增、修改、删除接口。审计只能由各业务接口在事务内写入。

## 9. 错误信息清单（统一文案）

| 场景 | message |
|---|---|
| 缺少原因 | `请填写操作原因` |
| 目标不存在 | `家庭不存在` / `菜品不存在` / `用户不存在` / `订单不存在` |
| 状态已变更 | `订单状态已变更` / `家庭已注销` 等，文案随对象 |
| 无可更新项 | `没有可更新的内容` |
| 登录失败 | `账号或密码错误` |
| 账号锁定 | `账号已锁定，请 N 分钟后重试` |

## 10. 路由与文件落点（实现参考）

- 路由：`server/src/routes/admin/`，按模块拆分；统一在 `routes/admin/index.ts` 挂载，并在 `app.ts` 中 `app.use('/api/admin', adminRouter)`。
- 中间件：`server/src/middlewares/adminAuth.ts`（`adminAuthRequired`）。
- Service：`server/src/services/admin/`，其中 `auditService.ts` 提供 `writeAudit(conn, entry)`，要求传入事务连接，保证与业务变更同一事务。
- 配置：`server/src/config/index.ts` 增加 `adminJwt.secret`、`adminJwt.expiresIn`，`server/.env.example` 增加 `ADMIN_JWT_SECRET`（占位符，不含真实值）。
- 迁移：`server/docs/migrations/2026112303_admin_console_v1.0.sql`，并同步 `jiawei_db_schema.sql` 与 `DATABASE.md`。

