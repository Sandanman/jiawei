/**
 * 路由与菜单元数据（同源，避免菜单与页面标题不一致）
 */
import type { ReactNode } from 'react'
import {
    AuditOutlined,
    CoffeeOutlined,
    GiftOutlined,
    HomeOutlined,
    ShoppingCartOutlined,
    UserOutlined
} from '@ant-design/icons'

export interface MenuRoute {
    path: string
    label: string
    icon: ReactNode
}

export const MENU_ROUTES: MenuRoute[] = [
    { path: '/families', label: '家庭管理', icon: <HomeOutlined /> },
    { path: '/dishes', label: '菜品管理', icon: <CoffeeOutlined /> },
    { path: '/users', label: '用户管理', icon: <UserOutlined /> },
    { path: '/orders', label: '订单管理', icon: <ShoppingCartOutlined /> },
    { path: '/reward-orders', label: '兑换记录', icon: <GiftOutlined /> },
    { path: '/audit-logs', label: '审计日志', icon: <AuditOutlined /> }
]

export const MENU_ITEMS = MENU_ROUTES.map(item => ({
    key: item.path,
    icon: item.icon,
    label: item.label
}))

export const ROUTE_TITLES: Record<string, string> = {
    ...Object.fromEntries(MENU_ROUTES.map(item => [item.path, item.label])),
    '/change-password': '修改密码'
}

export function getRouteTitle(path: string): string {
    return ROUTE_TITLES[path] || ''
}
