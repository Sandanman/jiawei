/**
 * API 相关类型（与后端 src/types/api.ts 对齐）
 */

export type FamilyRole = 'owner' | 'admin' | 'member'

export interface UserInfo {
    id: number
    nickname: string
    avatar: string
    phone: string
    points: number
    inviteCode?: string
}

export interface FamilyBrief {
    familyId: number
    familyName: string
    familyCode: string
    role: FamilyRole
    isAdmin: boolean
    isOwner: boolean
    points: number
    adminRemark: string
}

export interface FamilyDetail extends FamilyBrief {
    description: string
    ownerId: number
    memberCount: number
    createdAt: string
}

export interface LoginResult {
    token: string
    user: UserInfo
    families: FamilyBrief[]
}

export interface FamilyMember {
    id: number
    userId: number
    nickname: string
    avatar: string
    role: FamilyRole
    adminRemark: string
    isOwner: boolean
    joinedAt: string
}

export interface Invitation {
    code: string
    expiresAt: string
}

export interface JoinResult {
    familyId: number
    familyName: string
}

export interface CreateFamilyResult {
    familyId: number
    familyCode: string
}

// ===== 菜品 =====
export interface Dish {
    id: number
    familyId: number
    name: string
    description: string
    price: number
    points: number
    category: string
    imageUrl: string
    stock: number
    isPublished: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface CreateDishPayload {
    familyId: number
    name: string
    description?: string
    price: number
    points?: number
    category: string
    imageUrl?: string
    stock?: number
    isPublished?: boolean
    sortOrder?: number
}

export interface UpdateDishPayload extends Partial<Omit<CreateDishPayload, 'familyId'>> {}

// ===== 订单 =====
export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface OrderItem {
    id: number
    orderId: number
    dishId: number
    dishName: string
    dishImageUrl: string
    price: number
    points: number
    quantity: number
    subtotal: number
}

export interface Order {
    id: number
    orderNo: string
    familyId: number
    userId: number
    userNickname: string
    items: OrderItem[]
    totalAmount: number
    totalPoints: number
    status: OrderStatus
    remark: string
    createdAt: string
    updatedAt: string
}

export interface CreateOrderPayload {
    familyId: number
    items: Array<{ dishId: number; quantity: number }>
    remark?: string
}

export interface CreateOrderResult {
    orderId: number
    orderNo: string
    totalAmount: number
    totalPoints: number
}

// ===== 积分 =====
export type PointsRecordType =
    | 'order_deduct'
    | 'task_reward'
    | 'dish_reward'
    | 'manual_add'
    | 'manual_subtract'
    | 'reward_deduct'

export type PointsReferenceType = '' | 'order' | 'task' | 'dish' | 'reward'

export interface PointsRecord {
    id: number
    familyId: number
    userId: number
    userNickname: string
    pointsChange: number
    pointsBalance: number
    type: PointsRecordType
    referenceType: PointsReferenceType
    referenceId: number
    description: string
    createdAt: string
}

export interface PointsSummary {
    userId: number
    nickname: string
    avatar: string
    role: FamilyRole
    adminRemark: string
    isOwner: boolean
    points: number
    joinedAt: string
}

export interface AdjustPointsPayload {
    familyId: number
    userId: number
    points: number
    type: 'manual_add' | 'manual_subtract'
    description?: string
}

export interface AdjustPointsResult {
    recordId: number
    balance: number
}

// ===== 任务 =====
export type TaskStatus = 'draft' | 'published' | 'paused' | 'completed'

export interface TaskAssignee {
    id: number
    taskId: number
    userId: number
    nickname: string
    avatar: string
    isTaken: boolean
    assignedAt: string
    takenAt: string
    completedAt: string
}

export interface Task {
    id: number
    familyId: number
    creatorId: number
    creatorName: string
    title: string
    description: string
    category: string
    categoryName: string
    points: number
    deadline: string
    status: TaskStatus
    assignees: TaskAssignee[]
    createdAt: string
    updatedAt: string
}

export interface CreateTaskPayload {
    familyId: number
    title: string
    description?: string
    category?: string
    categoryName?: string
    points?: number
    deadline: string
    assigneeIds?: number[]
    status?: TaskStatus
}

export interface UpdateTaskPayload {
    familyId: number
    title?: string
    description?: string
    category?: string
    categoryName?: string
    points?: number
    deadline?: string
    assigneeIds?: number[]
}

export interface TakeTaskResult {
    taskId: number
    userId: number
    takenAt: string
}

export interface CompleteTaskResult {
    taskId: number
    userId: number
    points: number
    balance: number
    completedAt: string
}

// ===== 注册 / 重置密码 =====
export type RegisterType = 'phone' | 'username'

export interface RegisterPayload {
    type: RegisterType
    username: string
    password: string
    nickname?: string
}

export interface RegisterResult {
    userId: number
    username: string
    nickname: string
}

// ===== 积分商城 =====
export type RewardCategory = 'physical' | 'gift' | 'play' | 'dish'

export interface Reward {
    id: number
    familyId: number
    name: string
    description: string
    category: RewardCategory
    points: number
    imageUrl: string
    stock: number
    dishId: number | null
    dishName: string
    isPublished: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface CreateRewardPayload {
    familyId: number
    name: string
    description?: string
    category: RewardCategory
    points: number
    imageUrl?: string
    stock?: number
    dishId?: number | null
    isPublished?: boolean
    sortOrder?: number
}

export interface UpdateRewardPayload extends Partial<Omit<CreateRewardPayload, 'familyId'>> {}

export type RewardOrderStatus = 'pending' | 'received' | 'cancelled'

export interface RewardOrder {
    id: number
    rewardId: number
    rewardName: string
    rewardImage: string
    rewardPoints: number
    category: RewardCategory
    familyId: number
    userId: number
    userNickname: string
    userAvatar: string
    remark: string
    status: RewardOrderStatus
    receivedAt: string | null
    receivedBy: number | null
    createdAt: string
}

export interface RedeemRewardPayload {
    familyId: number
    rewardId: number
    remark?: string
}

export interface RedeemRewardResult {
    orderId: number
    balance: number
}
