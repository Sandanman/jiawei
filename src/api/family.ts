/**
 * 家庭 API
 */
import { http } from '@/utils/request'
import type {
    FamilyBrief,
    FamilyDetail,
    FamilyMember,
    Invitation,
    JoinResult,
    CreateFamilyResult,
    FamilyRole
} from './types'

/** 我的家庭列表 */
export function listFamilies() {
    return http.get<FamilyBrief[]>('/family')
}

/** 家庭详情 */
export function getFamily(familyId: number) {
    return http.get<FamilyDetail>(`/family/${familyId}`)
}

/** 创建家庭 */
export function createFamily(data: { familyName: string; description?: string }) {
    return http.post<CreateFamilyResult>('/family', data)
}

/** 更新家庭信息 */
export function updateFamily(
    familyId: number,
    data: { familyName?: string; description?: string }
) {
    return http.put<null>(`/family/${familyId}`, data)
}

/** 成员列表 */
export function listMembers(familyId: number) {
    return http.get<FamilyMember[]>(`/family/${familyId}/members`)
}

/** 修改成员角色/备注 */
export function updateMember(
    familyId: number,
    userId: number,
    data: { role?: FamilyRole; adminRemark?: string }
) {
    return http.patch<null>(`/family/${familyId}/members/${userId}`, data)
}

/** 移除/退出家庭 */
export function removeMember(familyId: number, userId: number) {
    return http.delete<null>(`/family/${familyId}/members/${userId}`)
}

/** 生成邀请码 */
export function createInvitation(familyId: number, expiresHours = 24) {
    return http.post<Invitation>(`/family/${familyId}/invitation`, { expiresHours })
}

/** 通过邀请码加入家庭 */
export function joinFamily(code: string, adminRemark?: string) {
    return http.post<JoinResult>('/family/join', { code, adminRemark })
}
