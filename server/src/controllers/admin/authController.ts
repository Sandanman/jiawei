/**
 * 管理端认证控制器（F1）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { BizError } from '../../utils/bizError'
import { adminLogin, getAdminProfile, changeAdminPassword } from '../../services/admin/authService'
import { clientIp } from './_common'

/**
 * POST /api/admin/auth/login
 * Body: { username, password }
 */
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body || {}
    if (!username || !password) {
        throw new BizError('账号和密码不能为空')
    }

    const result = await adminLogin(String(username).trim(), String(password), {
        ip: clientIp(req)
    })
    res.success(result, '登录成功')
})

/**
 * GET /api/admin/auth/me
 */
export const meHandler = asyncHandler(async (req: Request, res: Response) => {
    const admin = await getAdminProfile(req.admin!.id)
    res.success(admin)
})

/**
 * PUT /api/admin/auth/password
 * Body: { oldPassword, newPassword }
 */
export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body || {}
    if (!oldPassword || !newPassword) {
        throw new BizError('旧密码与新密码不能为空')
    }

    await changeAdminPassword(req.admin!.id, String(oldPassword), String(newPassword), {
        ip: clientIp(req)
    })
    res.success(null, '密码已修改，请重新登录')
})
