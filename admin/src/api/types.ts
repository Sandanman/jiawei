/**
 * 管理端接口类型（与 server/src/services/admin 返回结构对应）
 */

export interface PagedResult<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
}

/* ---------- 认证 F1 ---------- */

export interface AdminInfo {
    id: number
    username: string
    nickname: string
}

export interface LoginResult {
    token: string
    expiresIn: number
    admin: AdminInfo
}

export interface AdminProfile extends AdminInfo {
    lastLoginAt: string | null
}

/* ---------- 家庭 F2 ---------- */

export interface FamilyListItem {
    id: number
    familyCode: string
    familyName: string
    ownerId: number
    ownerNickname: string
    ownerPhone: string
    status: number
    memberCount: number
    dishCount: number
    orderCount: number
    createdAt: string
}

export interface FamilyMember {
    userId: number
    nickname: string
    phone: string
    role: string
    points: number
    adminRemark: string
    joinedAt: string
}

export interface FamilyStats {
    dishCount: number
    orderCount: number
    taskCount: number
    rewardCount: number
}

export interface FamilyDetail {
    id: number
    familyCode: string
    familyName: string
    description: string
    ownerId: number
    status: number
    createdAt: string
    updatedAt: string
    members: FamilyMember[]
    stats: FamilyStats
}

export interface CloseImpact {
    memberCount: number
    openOrderCount: number
    openTaskCount: number
    pendingRewardOrderCount: number
}

export interface FamilyUpdatePayload {
    familyName?: string
    description?: string
}

/* ---------- 菜品 F3 ---------- */

export interface DishItem {
    id: number
    familyId: number
    familyName: string
    name: string
    description: string
    price: number
    points: number
    category: string
    imageUrl: string
    stock: number
    isPublished: number
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface DishUpdatePayload {
    name?: string
    description?: string
    price?: string
    points?: number
    category?: string
    imageUrl?: string
    stock?: number
    sortOrder?: number
}

/* ---------- 用户 F4 ---------- */

export interface UserListItem {
    id: number
    nickname: string
    avatarUrl: string
    phone: string
    status: number
    regionName: string
    familyCount: number
    createdAt: string
}

export interface UserAccount {
    username: string
    loginType: string
    status: number
    lastLoginAt: string | null
}

export interface UserFamily {
    familyId: number
    familyName: string
    familyStatus: number
    role: string
    points: number
}

export interface UserDetail {
    id: number
    nickname: string
    avatarUrl: string
    phone: string
    status: number
    regionCode: string
    regionName: string
    regionSource: string
    createdAt: string
    account: UserAccount | null
    families: UserFamily[]
}

export interface OwnedFamily {
    id: number
    familyName: string
}

export interface DisableUserResult {
    ownedFamilies?: OwnedFamily[]
}

export interface ResetPasswordResult {
    username: string
    newPassword: string
}

/* ---------- 订单与兑换 F5 ---------- */

export interface OrderListItem {
    id: number
    orderNo: string
    familyId: number
    familyName: string
    userId: number
    nickname: string
    totalAmount: number
    totalPoints: number
    status: string
    remark: string
    createdAt: string
}

export interface OrderItemRow {
    dishId: number
    dishName: string
    dishImageUrl: string
    price: number
    points: number
    quantity: number
    subtotal: number
}

export interface PointsRecordItem {
    id: number
    pointsChange: number
    pointsBalance: number
    type: string
    description: string
    createdAt: string
}

export interface OrderDetail extends OrderListItem {
    items: OrderItemRow[]
    pointsRecords: PointsRecordItem[]
}

export interface RewardOrderItem {
    id: number
    rewardId: number
    rewardName: string
    rewardImage: string
    rewardPoints: number
    category: string
    familyId: number
    familyName: string
    userId: number
    nickname: string
    remark: string
    status: string
    receivedAt: string | null
    receivedBy: number | null
    createdAt: string
}

export type RewardOrderDetail = RewardOrderItem

export interface CancelResult {
    refundedPoints: number
}

/* ---------- 审计 F8 ---------- */

export interface AuditLogItem {
    id: number
    adminId: number
    adminName: string
    action: string
    targetType: string
    targetId: number | null
    familyId: number | null
    reason: string
    ip: string
    createdAt: string
}

export interface AuditLogDetail extends AuditLogItem {
    beforeData: any
    afterData: any
}
