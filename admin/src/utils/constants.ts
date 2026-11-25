/**
 * 枚举与文案映射
 */

export interface OptionItem {
    label: string
    value: string | number
}

/* 家庭状态 */
export const FAMILY_STATUS: Record<number, { label: string; color: string }> = {
    1: { label: '正常', color: 'success' },
    0: { label: '已注销', color: 'default' }
}

export const FAMILY_STATUS_OPTIONS: OptionItem[] = [
    { label: '正常', value: 1 },
    { label: '已注销', value: 0 }
]

/* 用户状态 */
export const USER_STATUS: Record<number, { label: string; color: string }> = {
    1: { label: '正常', color: 'success' },
    0: { label: '已禁用', color: 'error' }
}

export const USER_STATUS_OPTIONS: OptionItem[] = [
    { label: '正常', value: 1 },
    { label: '已禁用', value: 0 }
]

/* 菜品上下架 */
export const DISH_PUBLISH: Record<number, { label: string; color: string }> = {
    1: { label: '已上架', color: 'success' },
    0: { label: '已下架', color: 'default' }
}

export const DISH_PUBLISH_OPTIONS: OptionItem[] = [
    { label: '已上架', value: 1 },
    { label: '已下架', value: 0 }
]

/* 家族角色 */
export const MEMBER_ROLE: Record<string, string> = {
    owner: '房主',
    admin: '管理员',
    member: '成员'
}

/* 订单状态 */
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: '待确认', color: 'warning' },
    confirmed: { label: '已确认', color: 'processing' },
    completed: { label: '已完成', color: 'success' },
    cancelled: { label: '已取消', color: 'default' }
}

export const ORDER_STATUS_OPTIONS: OptionItem[] = [
    { label: '待确认', value: 'pending' },
    { label: '已确认', value: 'confirmed' },
    { label: '已完成', value: 'completed' },
    { label: '已取消', value: 'cancelled' }
]

/* 兑换状态 */
export const REWARD_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: '待领取', color: 'warning' },
    received: { label: '已领取', color: 'success' },
    cancelled: { label: '已撤销', color: 'default' }
}

export const REWARD_STATUS_OPTIONS: OptionItem[] = [
    { label: '待领取', value: 'pending' },
    { label: '已领取', value: 'received' },
    { label: '已撤销', value: 'cancelled' }
]

/* 奖励分类 */
export const REWARD_CATEGORY: Record<string, string> = {
    physical: '实物',
    gift: '礼物',
    play: '娱乐',
    dish: '菜品'
}

export const REWARD_CATEGORY_OPTIONS: OptionItem[] = [
    { label: '实物', value: 'physical' },
    { label: '礼物', value: 'gift' },
    { label: '娱乐', value: 'play' },
    { label: '菜品', value: 'dish' }
]

/* 审计动作文案 */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
    'auth.login': '登录',
    'auth.change_password': '修改密码',
    'family.update': '编辑家庭',
    'family.close': '注销家庭',
    'family.restore': '恢复家庭',
    'dish.update': '编辑菜品',
    'dish.publish': '上架/下架菜品',
    'dish.delete': '删除菜品',
    'user.disable': '禁用用户',
    'user.enable': '启用用户',
    'user.reset_password': '重置用户密码',
    'order.cancel': '强制取消订单',
    'reward_order.cancel': '撤销兑换'
}

export const AUDIT_TARGET_TYPE_LABEL: Record<string, string> = {
    admin: '管理员',
    family: '家庭',
    dish: '菜品',
    user: '用户',
    order: '订单',
    reward_order: '兑换记录'
}

/** 操作原因长度约束（与后端 requireReason 一致） */
export const REASON_MIN = 4
export const REASON_MAX = 200
