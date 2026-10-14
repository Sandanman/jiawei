/**
 * 积分 API
 */
import { http } from '@/utils/request'
import type {
    PointsRecord,
    PointsRecordType,
    PointsSummary,
    AdjustPointsPayload,
    AdjustPointsResult
} from './types'

/** 积分流水列表 */
export function listPointsRecords(
    familyId: number,
    options?: { mine?: boolean; userId?: number; type?: PointsRecordType }
) {
    const params: Record<string, any> = { familyId }
    if (options?.mine) params.mine = '1'
    if (options?.userId) params.userId = options.userId
    if (options?.type) params.type = options.type
    return http.get<PointsRecord[]>('/points', params)
}

/** 家庭成员积分汇总 */
export function listPointsSummaries(familyId: number) {
    return http.get<PointsSummary[]>('/points/summary', { familyId })
}

/** 流水详情 */
export function getPointsRecord(familyId: number, recordId: number) {
    return http.get<PointsRecord>(`/points/${recordId}`, { familyId })
}

/** 管理员手动调整积分 */
export function adjustPoints(data: AdjustPointsPayload) {
    return http.post<AdjustPointsResult>('/points/adjust', data)
}
