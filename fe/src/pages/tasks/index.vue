<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">{{ isAdmin ? '任务管理' : '我的任务' }}</text>
                <text class="page-subtitle">{{ isAdmin ? '管理家庭任务' : '完成任务赚取积分' }}</text>
            </view>
            <view v-if="isAdmin" class="add-btn" @tap="handleShowAddTask">
                <text>+ 发布任务</text>
            </view>
        </view>

        <!-- 筛选标签 -->
        <view class="filter-section">
            <view class="filter-tabs">
                <view
                    v-for="status in statusFilters"
                    :key="status.key"
                    class="filter-tab"
                    :class="{ active: currentStatus === status.key }"
                    @tap="handleStatusChange(status.key)"
                >
                    <text>{{ status.label }}</text>
                    <view v-if="status.count > 0" class="tab-badge">
                        <text>{{ status.count }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 任务列表（按天分组） -->
        <view class="task-list">
            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <template v-else>
                <view
                    v-for="group in groupedTasks"
                    :key="group.date"
                    class="task-group"
                >
                    <!-- 分组标题 -->
                    <view class="group-header" @tap="toggleGroup(group.date)">
                        <view class="group-title-row">
                            <view class="group-date-icon">
                                <text>{{ group.isToday ? '📅' : group.isTomorrow ? '⏰' : '📆' }}</text>
                            </view>
                            <view class="group-title-info">
                                <text class="group-title">{{ group.dateLabel }}</text>
                                <text class="group-count">{{ group.tasks.length }} 个任务</text>
                            </view>
                        </view>
                        <view class="group-toggle">
                            <text :class="['toggle-icon', { expanded: expandedGroups.includes(group.date) }]">›</text>
                        </view>
                    </view>

                    <!-- 分组任务列表（可展开/收起） -->
                    <view
                        v-show="expandedGroups.includes(group.date)"
                        class="group-tasks"
                    >
                        <view
                            v-for="task in group.tasks"
                            :key="task.id"
                            class="task-card"
                            :class="[task.status, { 'my-task': isMyTask(task) }]"
                            @tap="handleTaskDetail(task)"
                        >
                            <view class="task-header">
                                <view class="task-category">
                                    <text>{{ getCategoryIcon(task.category) }} {{ task.categoryName }}</text>
                                </view>
                                <view class="task-status-badge" :class="task.status">
                                    <text>{{ getStatusLabel(task.status) }}</text>
                                </view>
                            </view>

                            <text class="task-title">{{ task.title }}</text>
                            <text class="task-desc">{{ task.description }}</text>

                            <view class="task-info">
                                <view class="info-item">
                                    <text class="info-icon">👤</text>
                                    <text class="info-text">{{ getAssigneeLabel(task) }}</text>
                                </view>
                                <view class="info-item points">
                                    <text class="info-icon">⭐</text>
                                    <text class="info-text">+{{ task.points }}积分</text>
                                </view>
                            </view>

                            <!-- 管理员操作按钮 -->
                            <view v-if="isAdmin" class="task-actions">
                                <view class="action-btn edit" @tap.stop="handleEditTask(task)">
                                    <text>编辑</text>
                                </view>
                                <view v-if="task.status === 'draft' || task.status === 'paused'" class="action-btn publish" @tap.stop="handlePublishTask(task)">
                                    <text>发布</text>
                                </view>
                                <view v-if="task.status === 'published'" class="action-btn pause" @tap.stop="handlePauseTask(task)">
                                    <text>暂停</text>
                                </view>
                                <view class="action-btn delete" @tap.stop="handleDeleteTask(task)">
                                    <text>删除</text>
                                </view>
                            </view>

                            <!-- 成员操作按钮 -->
                            <view v-else-if="canTakeTask(task)" class="task-actions">
                                <view class="action-btn take" @tap.stop="handleTakeTask(task)">
                                    <text>接单</text>
                                </view>
                            </view>
                            <view v-else-if="canSubmitTask(task)" class="task-actions">
                                <view class="action-btn submit" @tap.stop="handleSubmitTask(task)">
                                    <text>提交成果</text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <view v-if="groupedTasks.length === 0" class="empty-state">
                    <text class="empty-icon">{{ isAdmin ? '📋' : '🎯' }}</text>
                    <text class="empty-text">{{ isAdmin ? '暂无任务' : '暂无可接任务' }}</text>
                    <text class="empty-hint">{{ isAdmin ? '点击右上角发布新任务' : '去看看其他任务吧' }}</text>
                </view>
            </template>
        </view>

        <!-- 添加/编辑任务弹窗 -->
        <view v-if="showTaskModal" class="modal-overlay" @tap="handleCloseModal">
            <view class="modal-content task-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ editingTask ? '编辑任务' : '发布任务' }}</text>
                    <text class="modal-close" @tap="handleCloseModal">×</text>
                </view>
                <scroll-view scroll-y class="modal-body">
                    <view class="form-item">
                        <text class="form-label">任务标题 *</text>
                        <input
                            v-model="taskForm.title"
                            class="form-input"
                            placeholder="请输入任务标题"
                        />
                    </view>

                    <view class="form-item">
                        <text class="form-label">任务描述 *</text>
                        <textarea
                            v-model="taskForm.description"
                            class="form-textarea"
                            placeholder="请输入任务详细描述"
                            rows="4"
                        />
                    </view>

                    <view class="form-item">
                        <text class="form-label">任务分类</text>
                        <view class="category-select">
                            <view
                                v-for="cat in categories"
                                :key="cat.key"
                                class="category-option"
                                :class="{ active: taskForm.category === cat.key }"
                                @tap="taskForm.category = cat.key"
                            >
                                <text>{{ cat.icon }} {{ cat.name }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="form-item">
                        <text class="form-label">积分奖励</text>
                        <view class="points-select">
                            <view
                                v-for="pts in [10, 20, 30, 50, 100]"
                                :key="pts"
                                class="points-option"
                                :class="{ active: taskForm.points === pts }"
                                @tap="taskForm.points = pts"
                            >
                                <text>{{ pts }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="form-item">
                        <text class="form-label">指派给</text>
                        <view class="member-select">
                            <view
                                v-for="member in familyMembers"
                                :key="member.userId"
                                class="member-option"
                                :class="{ active: taskForm.assigneeIds.includes(member.userId) }"
                                @tap="toggleAssignee(member.userId)"
                            >
                                <image class="option-avatar" :src="member.avatar || '/static/default-avatar.svg'" mode="aspectFill" />
                                <text class="option-name">{{ member.nickname }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="form-item">
                        <text class="form-label">截止日期</text>
                        <picker mode="date" :value="taskForm.deadline" @change="handleDateChange">
                            <view class="date-picker">
                                <text>{{ taskForm.deadline || '选择日期' }}</text>
                                <text class="picker-arrow">›</text>
                            </view>
                        </picker>
                    </view>
                </scroll-view>
                <view class="modal-footer">
                    <view class="modal-btn cancel" @tap="handleCloseModal">
                        <text>取消</text>
                    </view>
                    <view class="modal-btn confirm" @tap="handleSaveTask">
                        <text>{{ editingTask ? '保存' : '发布' }}</text>
                    </view>
                </view>
            </view>
        </view>

        <CustomTabBar />
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import CustomTabBar from '@/components/custom-tab-bar/index.vue'
import * as taskApi from '@/api/task'
import * as pointsApi from '@/api/points'
import type { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '@/api/types'
import type { PointsSummary } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 任务分类
const categories = [
    { key: 'cooking', name: '做饭', icon: '🍳' },
    { key: 'shopping', name: '购物', icon: '🛒' },
    { key: 'cleaning', name: '打扫', icon: '🧹' },
    { key: 'washing', name: '洗碗', icon: '🍽️' },
    { key: 'other', name: '其他', icon: '📌' },
]

// 状态筛选
const statusFilters = ref([
    { key: 'all', label: '全部', count: 0 },
    { key: 'draft', label: '草稿', count: 0 },
    { key: 'published', label: '已发布', count: 0 },
    { key: 'completed', label: '已完成', count: 0 },
])

// 任务状态
const taskStatuses: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    paused: '已暂停',
    completed: '已完成',
}

// 是否是管理员
const isAdmin = computed(() => userStore.isAdmin())
const familyId = computed(() => userStore.familyId)

// 当前筛选状态
const currentStatus = ref<string>('all')

// 家庭成员（从积分汇总接口获取）
const familyMembers = ref<PointsSummary[]>([])

// 任务数据
const tasks = ref<Task[]>([])
const loading = ref(false)

// 更新状态计数
const updateStatusCounts = () => {
    statusFilters.value[0].count = tasks.value.length
    statusFilters.value[1].count = tasks.value.filter(t => t.status === 'draft').length
    statusFilters.value[2].count = tasks.value.filter(t => t.status === 'published').length
    statusFilters.value[3].count = tasks.value.filter(t => t.status === 'completed').length
}

// 筛选任务
const filteredTasks = computed(() => {
    if (currentStatus.value === 'all') {
        return tasks.value
    }
    return tasks.value.filter(t => t.status === currentStatus.value)
})

// 展开的分组
const expandedGroups = ref<string[]>([])

// 按天分组的任务
interface TaskGroup {
    date: string
    dateLabel: string
    isToday: boolean
    isTomorrow: boolean
    tasks: Task[]
}

const groupedTasks = computed((): TaskGroup[] => {
    const groups: Record<string, Task[]> = {}

    // 按日期分组
    filteredTasks.value.forEach(task => {
        if (!groups[task.deadline]) {
            groups[task.deadline] = []
        }
        groups[task.deadline].push(task)
    })

    // 转换为分组数组并排序
    const groupList: TaskGroup[] = Object.keys(groups).map(date => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const todayStr = formatDate(now)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = formatDate(tomorrow)

        let dateLabel = date
        let isToday = false
        let isTomorrow = false

        if (date === todayStr) {
            dateLabel = '今天'
            isToday = true
        } else if (date === tomorrowStr) {
            dateLabel = '明天'
            isTomorrow = true
        } else {
            // 格式化为 "6月15日"
            const d = new Date(date)
            dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`
        }

        return {
            date,
            dateLabel,
            isToday,
            isTomorrow,
            tasks: groups[date],
        }
    })

    // 按日期排序（今天 -> 明天 -> 未来 -> 过去）
    groupList.sort((a, b) => {
        if (a.isToday) return -1
        if (b.isToday) return 1
        if (a.isTomorrow) return -1
        if (b.isTomorrow) return 1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    // 默认展开所有分组
    if (expandedGroups.value.length === 0) {
        expandedGroups.value = groupList.map(g => g.date)
    }

    return groupList
})

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 切换分组展开/收起
const toggleGroup = (date: string) => {
    const index = expandedGroups.value.indexOf(date)
    if (index > -1) {
        expandedGroups.value.splice(index, 1)
    } else {
        expandedGroups.value.push(date)
    }
}

// 弹窗状态
const showTaskModal = ref(false)
const editingTask = ref<Task | null>(null)

// 任务表单
const taskForm = ref({
    title: '',
    description: '',
    category: 'cooking',
    points: 20,
    assigneeIds: [] as number[],
    deadline: getTomorrow(),
})

// 辅助函数
function getToday() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getTomorrow() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
}

// 检查登录状态
onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await Promise.all([loadTasks(), loadMembers()])
})

async function loadTasks() {
    if (!familyId.value) return
    loading.value = true
    try {
        tasks.value = await taskApi.listTasks(familyId.value)
        updateStatusCounts()
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

async function loadMembers() {
    if (!familyId.value) return
    try {
        familyMembers.value = await pointsApi.listPointsSummaries(familyId.value)
    } catch (err) {
        // ignore
    }
}

const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category)
    return cat?.icon || '📌'
}

const getStatusLabel = (status: string) => {
    return taskStatuses[status] || status
}

/** 获取指派人显示文本 */
const getAssigneeLabel = (task: Task): string => {
    if (task.assignees.length === 0) return '待指派'
    const names = task.assignees.map(a => a.nickname).join('、')
    return names
}

/** 是否当前用户的任务（在指派列表中） */
const isMyTask = (task: Task): boolean => {
    return task.assignees.some(a => a.userId === userStore.userId)
}

/** 当前用户是否可以接单 */
const canTakeTask = (task: Task): boolean => {
    if (task.status !== 'published') return false
    const mine = task.assignees.find(a => a.userId === userStore.userId)
    return !!mine && !mine.isTaken
}

/** 当前用户是否可以提交成果 */
const canSubmitTask = (task: Task): boolean => {
    if (task.status !== 'published') return false
    const mine = task.assignees.find(a => a.userId === userStore.userId)
    return !!mine && mine.isTaken && !mine.completedAt
}

// 切换状态筛选
const handleStatusChange = (key: string) => {
    currentStatus.value = key
}

// 显示添加任务弹窗
const handleShowAddTask = () => {
    editingTask.value = null
    taskForm.value = {
        title: '',
        description: '',
        category: 'cooking',
        points: 20,
        assigneeIds: [],
        deadline: getTomorrow(),
    }
    showTaskModal.value = true
}

// 编辑任务
const handleEditTask = (task: Task) => {
    editingTask.value = task
    taskForm.value = {
        title: task.title,
        description: task.description,
        category: task.category,
        points: task.points,
        assigneeIds: task.assignees.map(a => a.userId),
        deadline: task.deadline,
    }
    showTaskModal.value = true
}

// 关闭弹窗
const handleCloseModal = () => {
    showTaskModal.value = false
    editingTask.value = null
}

// 日期选择
const handleDateChange = (e: any) => {
    taskForm.value.deadline = e.detail.value
}

// 切换指派人
const toggleAssignee = (userId: number) => {
    const idx = taskForm.value.assigneeIds.indexOf(userId)
    if (idx > -1) {
        taskForm.value.assigneeIds.splice(idx, 1)
    } else {
        taskForm.value.assigneeIds.push(userId)
    }
}

// 保存任务
const handleSaveTask = async () => {
    if (!taskForm.value.title.trim()) {
        uni.showToast({ title: '请输入任务标题', icon: 'none' })
        return
    }
    if (!taskForm.value.description.trim()) {
        uni.showToast({ title: '请输入任务描述', icon: 'none' })
        return
    }
    if (!familyId.value) return

    try {
        if (editingTask.value) {
            // 编辑
            const payload: UpdateTaskPayload = {
                familyId: familyId.value,
                title: taskForm.value.title,
                description: taskForm.value.description,
                category: taskForm.value.category,
                points: taskForm.value.points,
                deadline: taskForm.value.deadline,
                assigneeIds: taskForm.value.assigneeIds,
            }
            await taskApi.updateTask(editingTask.value.id, payload)
            uni.showToast({ title: '任务已更新', icon: 'success' })
        } else {
            // 新增
            const payload: CreateTaskPayload = {
                familyId: familyId.value,
                title: taskForm.value.title,
                description: taskForm.value.description,
                category: taskForm.value.category,
                points: taskForm.value.points,
                deadline: taskForm.value.deadline,
                assigneeIds: taskForm.value.assigneeIds,
                status: 'draft',
            }
            await taskApi.createTask(payload)
            uni.showToast({ title: '任务已创建', icon: 'success' })
        }

        await loadTasks()
        handleCloseModal()
    } catch (err) {
        // ignore
    }
}

// 发布任务
const handlePublishTask = async (task: Task) => {
    if (!familyId.value) return
    try {
        await taskApi.publishTask(familyId.value, task.id)
        uni.showToast({ title: '任务已发布', icon: 'success' })
        await loadTasks()
    } catch (err) {
        // ignore
    }
}

// 暂停任务
const handlePauseTask = async (task: Task) => {
    if (!familyId.value) return
    try {
        await taskApi.pauseTask(familyId.value, task.id)
        uni.showToast({ title: '任务已暂停', icon: 'success' })
        await loadTasks()
    } catch (err) {
        // ignore
    }
}

// 删除任务
const handleDeleteTask = (task: Task) => {
    if (!familyId.value) return
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这个任务吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await taskApi.deleteTask(familyId.value, task.id)
                    uni.showToast({ title: '任务已删除', icon: 'success' })
                    await loadTasks()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

// 任务详情
const handleTaskDetail = (task: Task) => {
    const assigneeText = getAssigneeLabel(task)
    uni.showModal({
        title: task.title,
        content: `${task.description}\n\n分类：${task.categoryName}\n积分：${task.points}\n指派：${assigneeText}\n截止：${task.deadline}\n状态：${getStatusLabel(task.status)}`,
        showCancel: false,
    })
}

// 接单任务
const handleTakeTask = async (task: Task) => {
    if (!familyId.value) return
    try {
        await taskApi.takeTask(familyId.value, task.id)
        uni.showToast({ title: '接单成功', icon: 'success' })
        await loadTasks()
    } catch (err) {
        // ignore
    }
}

// 提交成果
const handleSubmitTask = (task: Task) => {
    if (!familyId.value) return
    uni.showModal({
        title: '提交成果',
        content: '确认完成此任务并提交成果？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    const result = await taskApi.completeTask(familyId.value, task.id)
                    uni.showToast({ title: `任务完成！+${result.points}积分`, icon: 'success' })
                    await loadTasks()
                    // 同步当前登录用户全局积分
                    if (userStore.userId === task.assignees.find(a => a.userId === userStore.userId)?.userId) {
                        userStore.updateCurrentPoints(result.balance)
                    }
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}
</script>

<style scoped lang="scss">
.container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 120rpx;
}

// 页面头部
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
}

.page-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
    display: block;
}

.page-subtitle {
    font-size: 24rpx;
    color: #999;
}

.add-btn {
    padding: 16rpx 28rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 24rpx;
    font-size: 26rpx;
}

// 筛选标签
.filter-section {
    padding: 0 24rpx;
    margin-bottom: 20rpx;
}

.filter-tabs {
    display: flex;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 8rpx;
}

.filter-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 0;
    font-size: 26rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.tab-badge {
    margin-left: 8rpx;
    padding: 2rpx 10rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 10rpx;
    font-size: 20rpx;
}

// 任务分组
.task-group {
    margin-bottom: 16rpx;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 24rpx;
    background-color: #fff;
    border-radius: 16rpx;
    margin-bottom: 12rpx;
}

.group-title-row {
    display: flex;
    align-items: center;
}

.group-date-icon {
    font-size: 36rpx;
    margin-right: 16rpx;
}

.group-title-info {
    display: flex;
    flex-direction: column;
}

.group-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 4rpx;
}

.group-count {
    font-size: 24rpx;
    color: #999;
}

.group-toggle {
    padding: 8rpx;
}

.toggle-icon {
    font-size: 36rpx;
    color: #ccc;
    transition: transform 0.3s;
    display: inline-block;

    &.expanded {
        transform: rotate(90deg);
    }
}

.group-tasks {
    // empty
}

.task-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 12rpx;
    margin-left: 24rpx;

    &.draft {
        border-left: 6rpx solid #999;
    }

    &.published {
        border-left: 6rpx solid #4caf50;
    }

    &.paused {
        border-left: 6rpx solid #f0ad4e;
    }

    &.completed {
        border-left: 6rpx solid #1976d2;
        opacity: 0.7;
    }

    &.my-task {
        border: 2rpx solid var(--theme-primary);
    }
}
.task-list {
    padding: 0 24rpx;
}

.task-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.task-category {
    padding: 6rpx 14rpx;
    background-color: #f5f5f5;
    border-radius: 8rpx;
    font-size: 22rpx;
    color: #666;
}

.task-status-badge {
    padding: 6rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;

    &.draft {
        background-color: #f5f5f5;
        color: #999;
    }

    &.published {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.paused {
        background-color: #fff3e0;
        color: #f0ad4e;
    }

    &.completed {
        background-color: #e3f2fd;
        color: #1976d2;
    }
}

.task-title {
    display: block;
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
}

.task-desc {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 16rpx;
    line-height: 1.5;
}

.task-info {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.info-item {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #999;

    &.points {
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.info-icon {
    margin-right: 6rpx;
}

.info-text.urgent {
    color: #f44336;
}

// 操作按钮
.task-actions {
    display: flex;
    gap: 12rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #f5f5f5;
}

.action-btn {
    flex: 1;
    padding: 14rpx 0;
    text-align: center;
    border-radius: 8rpx;
    font-size: 24rpx;

    &.edit {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    &.publish {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.pause {
        background-color: #fff3e0;
        color: #f0ad4e;
    }

    &.delete {
        background-color: #ffebee;
        color: #f44336;
    }

    &.take {
        background-color: var(--theme-primary);
        color: #fff;
    }

    &.submit {
        background-color: #4caf50;
        color: #fff;
    }
}

// 空状态
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100rpx 0;
}

.empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
}

.empty-hint {
    font-size: 24rpx;
    color: #999;
}

// 弹窗
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
}

.task-modal {
    width: 100%;
    max-height: 85vh;
    background-color: #fff;
    border-radius: 32rpx 32rpx 0 0;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.modal-close {
    font-size: 48rpx;
    color: #999;
    line-height: 1;
}

.modal-body {
    padding: 24rpx 32rpx;
    max-height: 60vh;
}

.form-item {
    margin-bottom: 28rpx;
}

.form-label {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
}

.form-textarea {
    width: 100%;
    padding: 20rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.category-select {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.category-option {
    padding: 12rpx 20rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.points-select {
    display: flex;
    gap: 12rpx;
}

.points-option {
    flex: 1;
    padding: 16rpx 0;
    text-align: center;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.member-select {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.member-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx;
    background-color: #f5f5f5;
    border-radius: 16rpx;
    min-width: 120rpx;

    &.active {
        background-color: var(--theme-primary-bg);
    }
}

.option-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    margin-bottom: 8rpx;
    background-color: #e0e0e0;
}

.option-name {
    font-size: 24rpx;
    color: #666;

    .member-option.active & {
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.date-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    height: 80rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
}

.picker-arrow {
    font-size: 36rpx;
    color: #999;
}

.modal-footer {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
    flex: 1;
    padding: 28rpx 0;
    text-align: center;
    font-size: 30rpx;

    &.cancel {
        color: #666;
        border-right: 1rpx solid #f0f0f0;
    }

    &.confirm {
        color: var(--theme-primary);
        font-weight: bold;
    }
}
</style>
