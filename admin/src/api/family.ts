import { get, post, put } from './http'
import type {
    CloseImpact,
    FamilyDetail,
    FamilyListItem,
    FamilyUpdatePayload,
    PagedResult
} from './types'

export interface FamilyListQuery {
    keyword?: string
    status?: number
    page: number
    pageSize: number
}

/** 家庭列表 */
export function listFamilies(query: FamilyListQuery): Promise<PagedResult<FamilyListItem>> {
    return get<PagedResult<FamilyListItem>>('/families', query)
}

/** 家庭详情 */
export function getFamily(id: number): Promise<FamilyDetail> {
    return get<FamilyDetail>(`/families/${id}`)
}

/** 编辑家庭名称/描述 */
export function updateFamily(id: number, payload: FamilyUpdatePayload): Promise<null> {
    return put<null>(`/families/${id}`, payload)
}

/** 注销前影响范围 */
export function getCloseImpact(id: number): Promise<CloseImpact> {
    return get<CloseImpact>(`/families/${id}/close-impact`)
}

/** 注销家庭 */
export function closeFamily(id: number, reason: string): Promise<null> {
    return post<null>(`/families/${id}/close`, { reason })
}

/** 恢复家庭 */
export function restoreFamily(id: number, reason: string): Promise<null> {
    return post<null>(`/families/${id}/restore`, { reason })
}
