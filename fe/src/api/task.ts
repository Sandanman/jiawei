/**
 * 任务 API
 */
import { http } from '@/utils/request'
import type {
    Task,
    TaskStatus,
    CreateTaskPayload,
    UpdateTaskPayload,
    TakeTaskResult,
    CompleteTaskResult
} from './types'

/** 任务列表 */
export function listTasks(
    familyId: number,
    options?: { status?: TaskStatus; mine?: boolean }
) {
    const params: Record<string, any> = { familyId }
    if (options?.status) params.status = options.status
    if (options?.mine) params.mine = '1'
    return http.get<Task[]>('/task', params)
}

/** 任务详情 */
export function getTask(familyId: number, taskId: number) {
    return http.get<Task>(`/task/${taskId}`, { familyId })
}

/** 创建任务（管理员） */
export function createTask(data: CreateTaskPayload) {
    return http.post<{ taskId: number }>('/task', data)
}

/** 更新任务（管理员） */
export function updateTask(taskId: number, data: UpdateTaskPayload) {
    return http.put<void>(`/task/${taskId}`, data)
}

/** 删除任务（管理员） */
export function deleteTask(familyId: number, taskId: number) {
    return http.delete<void>(`/task/${taskId}`, { familyId })
}

/** 发布任务（管理员） */
export function publishTask(familyId: number, taskId: number) {
    return http.patch<void>(`/task/${taskId}/publish`, { familyId })
}

/** 暂停任务（管理员） */
export function pauseTask(familyId: number, taskId: number) {
    return http.patch<void>(`/task/${taskId}/pause`, { familyId })
}

/** 接单 */
export function takeTask(familyId: number, taskId: number) {
    return http.patch<TakeTaskResult>(`/task/${taskId}/take`, { familyId })
}

/** 完成任务 */
export function completeTask(familyId: number, taskId: number) {
    return http.patch<CompleteTaskResult>(`/task/${taskId}/complete`, { familyId })
}
