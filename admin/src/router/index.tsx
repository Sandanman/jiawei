/**
 * 路由表：统一使用“守卫 + 版式”结构
 */
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import BasicLayout from '../layouts/basic-layout'
import AuthLayout from '../layouts/auth-layout'
import { getToken } from '../stores/token'
import { useAuth } from '../stores/auth-store'
import LoginPage from '../pages/login'
import ChangePasswordPage from '../pages/change-password'
import FamilyListPage from '../pages/families/list'
import FamilyDetailPage from '../pages/families/detail'
import DishListPage from '../pages/dishes/list'
import UserListPage from '../pages/users/list'
import UserDetailPage from '../pages/users/detail'
import OrderListPage from '../pages/orders/list'
import OrderDetailPage from '../pages/orders/detail'
import RewardOrderListPage from '../pages/reward-orders/list'
import RewardOrderDetailPage from '../pages/reward-orders/detail'
import AuditLogListPage from '../pages/audit-logs/list'
import AuditLogDetailPage from '../pages/audit-logs/detail'
import ExceptionPage from '../pages/exception'

function RequireAuth({ children }: { children: ReactNode }) {
    const { loading } = useAuth()

    if (!getToken()) {
        return <Navigate to="/login" replace />
    }

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Spin size="large" />
            </div>
        )
    }

    return <>{children}</>
}

export const router = createBrowserRouter([
    {
        path: '/login',
        element: (
            <AuthLayout>
                <LoginPage />
            </AuthLayout>
        )
    },
    {
        path: '/',
        element: (
            <RequireAuth>
                <BasicLayout />
            </RequireAuth>
        ),
        children: [
            { index: true, element: <Navigate to="/families" replace /> },
            { path: 'families', element: <FamilyListPage /> },
            { path: 'families/:id', element: <FamilyDetailPage /> },
            { path: 'dishes', element: <DishListPage /> },
            { path: 'users', element: <UserListPage /> },
            { path: 'users/:id', element: <UserDetailPage /> },
            { path: 'orders', element: <OrderListPage /> },
            { path: 'orders/:id', element: <OrderDetailPage /> },
            { path: 'reward-orders', element: <RewardOrderListPage /> },
            { path: 'reward-orders/:id', element: <RewardOrderDetailPage /> },
            { path: 'audit-logs', element: <AuditLogListPage /> },
            { path: 'audit-logs/:id', element: <AuditLogDetailPage /> },
            { path: 'change-password', element: <ChangePasswordPage /> }
        ]
    },
    { path: '*', element: <ExceptionPage code="404" /> }
])
